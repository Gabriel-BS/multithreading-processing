import { throws } from "assert";
import { find } from "lodash";
import { parentPort, workerData } from "worker_threads";

export interface TaskDefinition {
  id: number;
  data: any[];
  available: boolean;
}

export class TaskPool {
  private tasks: TaskDefinition[] = [];

  constructor(tasks: any[]) {
    this.tasks = tasks.map((task, idx) => {
      return {
        available: true,
        data: task,
        id: idx + 1,
      };
    });
  }

  getUndoneTask(){
    const task = this.tasks.find((task) => task.available === true);

    if(task){
      return task;
    }
  }

  updateUndoneTask(taskId: number){
    const task = this.tasks.find((task) => task.id === taskId);
    const taskIdx = this.tasks.findIndex((task) => task.id === taskId);

    if(task){
      // Atualiza task
      task.available = false;
      this.tasks[taskIdx] = task;

      return task;
    }
  }

  getCompletedTasks(){
    const completed = this.tasks.filter((task) => task.available === false).length;
    const total = this.tasks.length;

    return {completed, total}
  }
}
