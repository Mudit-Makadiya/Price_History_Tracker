const { Pool } = require("pg");
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Price_History_Tracker",
  password: "pgadKB02@",
  port: 5432,
});

const Query = async () => {    
  const ans = await pool.query("select * from pht_db.admin");
  console.log(ans.rows);
  await pool.end();
};

Query();
