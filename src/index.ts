import  { WorkerPool } from './worker-pool/worker-pool'
import { cpus } from 'os'
import _ from 'lodash';
import { TaskPool } from './task';

function initializeTasks(){
    const tasks = Array.from({length: 25000000}).map((_, idx) => ({id: idx + 1}))
    const chunk = _.chunk(tasks, 1000);

    const taskPool = new TaskPool(chunk);
    return taskPool;
}


function initializeWorkers(){
    const numOfCpus = cpus().length - 6;
    const Pool = new WorkerPool(numOfCpus);

    return Pool;
}


function init(){

    const pool = initializeWorkers();
    const tasks = initializeTasks();

    while (pool.getAvailableWorker() && tasks.getUndoneTask()) {
        const worker = pool.getAvailableWorker()!;
        const task = tasks.getUndoneTask()!
        tasks.updateUndoneTask(task.id)
        pool.setTaskToAvailableWorker(worker.id, 'worker/worker', task)
    }


    // Evento que é enviado quando um worker é liberado
    pool.on('workerReleased', () => {
        if(tasks.getUndoneTask()){
            const undoneTask = tasks.getUndoneTask()!;
            const availableWorker = pool.getAvailableWorker()!;

            tasks.updateUndoneTask(undoneTask.id)
            pool.setTaskToAvailableWorker(availableWorker.id, 'worker/worker', undoneTask);
        }
    })

    // evento que é enviado quando um worker termina uma tarefa
    // pool.on('increaseProgress', () => {
    //     const tasksMetadata = tasks.getCompletedTasks();
    //     console.log(`Tarefas completadas ${tasksMetadata.completed} de ${tasksMetadata.total}`);
    //     console.log(`Progresso: ${(tasksMetadata.completed * 100) / tasksMetadata.total}%`);
    // })
}


init()