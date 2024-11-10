import * as pg from "pg";
const { Pool } = pg.default;

const connectionPool = new Pool({
    connectionString:"PostgreSQL://postgres:ZaxBam55666@localhost:5432/Book_Collection"
});

export default connectionPool;