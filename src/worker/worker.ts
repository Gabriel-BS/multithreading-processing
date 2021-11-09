import { parentPort, workerData } from "worker_threads";
import { WorkerData } from "../worker-pool";
import { Pool } from "pg";

const data = (workerData as WorkerData).data;

const pool = new Pool({
  user: 'root',
  password: 'password',
  database: 'medkortex',
  host: 'localhost',
  max: 10,
  min: 5
})

pool.connect().then(client => {
  const proms: Promise<any>[] = []

  return client.query('BEGIN').then(() => {
    for (let index = 0; index < data.length; index++) {
      const element = data[index];
      const sql = `INSERT INTO import_schema.teste (id) VALUES ($1)`;    
      const prom = client.query(sql, [element.id]);
      proms.push(prom);
    }

    return Promise.all(proms).then(() => {
      return client.query('COMMIT').then((val) => val)
    })
  })
})

parentPort?.postMessage(workerData);
