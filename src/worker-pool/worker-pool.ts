import EventEmitter from "events";
import { Worker } from "worker_threads";
import { join } from "path";
import { TaskDefinition } from "../task";

export interface WorkerDefinition {
  id: number;
  workerFile?: string;
  available: boolean;
}

export interface WorkerResult {
  workerId: number;
  result: any;
}

export interface WorkerData {
  id: number;
  data: any[];
  done: boolean;
  available: boolean;
  workerId: number;
}

export class WorkerPool extends EventEmitter {
  pool: WorkerDefinition[] = [];

  constructor(numOfWorkers: number) {
    super();

    for (let index = 0; index < numOfWorkers; index++) {
      this.pool.push({
        id: index + 1,
        available: true,
        workerFile: undefined,
      });
    }
  }

  async setTaskToAvailableWorker(
    workerId: number,
    fileTaskWorker: string,
    data: TaskDefinition
  ) {
    const worker = this.pool.find((wk) => wk.id === workerId);
    const idx = this.pool.findIndex((wk) => wk.id === workerId);

    if (!worker || worker?.available === false || idx === -1) {
      throw new Error("Worker não está disponível");
    }

    // Atualiza worker
    worker.workerFile = fileTaskWorker;
    worker.available = false;
    this.pool[idx] = worker;

    return new Promise((resolve, reject) => {
      const workerData = { workerId, ...data };

      const worker = new Worker(join(__dirname, "..") + "/" + fileTaskWorker, {
        workerData,
      });

      const onMessage = (res: WorkerResult) => {
        worker.removeListener("error", onError);
        this.releaseWorker(res.workerId);
        resolve(res);
      };

      const onError = (err: any) => {
        worker.removeListener("message", onMessage);
        reject(err);
      };

      worker.once("message", onMessage);
      worker.once("error", onError);
    });
  }

  private releaseWorker(workerId: number) {
    const worker = this.pool.find((wk) => wk.id === workerId);
    const idx = this.pool.findIndex((wk) => wk.id === workerId);

    // Atualiza worker
    worker!.workerFile = undefined;
    worker!.available = true;

    this.pool[idx] = worker!;

    this.emit("workerReleased", { ...worker });
    this.emit("increaseProgress");
  }

  getAvailableWorker() {
    const worker = this.pool.find((worker) => worker.available === true);
    if(worker){
      return worker
    }
  }
}
