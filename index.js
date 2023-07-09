require('dotenv').config();
const express = require("express");
const path = require("path");
const app = express();
const { Client } = require("pg");
const methodOverride = require("method-override");

const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "Price_History_Tracker",
  password: process.env.DB_PASSWORD,
  port: 5432,
});

try {
  client.connect();
  console.log("connected to database");
} catch (err) {
  console.log("cannot connect to database");
  console.log(err);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

//middlewares
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

//home page
app.get("/", (req, res) => {
  res.redirect("/home");
});

app.get("/home", (req, res) => {
  res.render("home");
});

//end users CRUD
app.get("/endUsers", async (req, res) => {
  const queryText = `select * from pht_db.end_user`;
  const { rows } = await client.query(queryText);
  res.render("endUsers", { users: rows });
});

app.get("/endUsers/addUser", async (req, res) => {
  res.render("addUser");
});

const validateUserData = (
  first_name,
  last_name,
  user_name,
  email,
  contact_number,
  date_of_birth,
  password
) => {
  let valid = true;
  let empty = "";
  let exp = /[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]/;
  valid &= first_name != empty;
  valid &= last_name != empty;
  valid &= user_name != empty;
  valid &= email != empty;
  valid &= contact_number != empty;
  valid &= date_of_birth != empty;
  valid &= password != empty;
  valid &= exp.test(contact_number);
  return valid;
};

app.post("/endUsers/addUser", async (req, res) => {
  const {
    first_name,
    last_name,
    user_name,
    email,
    contact_number,
    date_of_birth,
    password,
  } = req.body;
  const { rows } = await client.query(
    `select max(user_id) from pht_db.end_user`
  );
  const id = Number(rows[0].max) + 1;
  const queryText = `insert into pht_db.end_user(first_name,last_name,user_name,email,contact_number,date_of_birth,password,user_role,user_id) values('${first_name}','${last_name}','${user_name}','${email}','${contact_number}','${date_of_birth}','${password}','end_user',${id})`;
  const valid = validateUserData(
    first_name,
    last_name,
    user_name,
    email,
    contact_number,
    date_of_birth,
    password
  );
  if (!valid) {
    return res.render("addUserResult", { valid });
  }
  await client.query(queryText);
  res.render("addUserResult", { valid });
});

app.get("/endUsers/editUser/:id", async (req, res) => {
  const { id } = req.params;
  const queryText = `select * from pht_db.end_user where user_id=${id}`;
  const { rows } = await client.query(queryText);
  res.render("editUser", { user: rows[0] });
});

app.patch("/endUsers/editUser/:id", async (req, res) => {
  const { id } = req.params;
  const {
    first_name,
    last_name,
    user_name,
    email,
    contact_number,
    date_of_birth,
    password,
  } = req.body;
  const queryText = `update pht_db.end_user set first_name='${first_name}',last_name='${last_name}',user_name='${user_name}',email='${email}',contact_number='${contact_number}',date_of_birth='${date_of_birth}',password='${password}' where user_id=${id}`;
  let valid = validateUserData(
    first_name,
    last_name,
    user_name,
    email,
    contact_number,
    date_of_birth,
    password
  );
  if (!valid) {
    return res.render("editUserResult", { valid });
  }
  await client.query(queryText);
  res.render("editUserResult", { valid });
});

app.delete("/endUsers/deleteUser/:id", async (req, res) => {
  const { id } = req.params;
  const queryText = `delete from pht_db.end_user where user_id=${id}`;
  await client.query(queryText);
  res.redirect("/endUsers");
});

//products CRUD
app.get("/products", async (req, res) => {
  const queryText = `select * from pht_db.product_details`;
  const { rows } = await client.query(queryText);
  res.render("products", { products: rows });
});

app.get("/products/addProduct", (req, res) => {
  res.render("addProduct");
});

const validateProductData = (
  product_name,
  description,
  source_image,
  actual_price,
  price_offered,
  pe_id,
  ce_id
) => {
  let valid = true;
  valid &= product_name != "";
  valid &= description != "";
  valid &= source_image != "";
  valid &= Number(actual_price) > 0;
  valid &= Number(price_offered) > 0;
  valid &= Number(ce_id) >= 1 && Number(ce_id) <= 9;
  valid &= Number(pe_id) >= 1 && Number(pe_id) <= 40;
  return valid;
};

app.post("/products/addProduct", async (req, res) => {
  const {
    product_name,
    description,
    source_image,
    actual_price,
    price_offered,
    pe_id,
    ce_id,
  } = req.body;
  const { rows } = await client.query(
    `select max(product_id) from pht_db.product_details`
  );
  const id = Number(rows[0].max) + 1;
  const queryText = `insert into pht_db.product_details(product_name,description,source_image,actual_price,price_offered,pe_id,ce_id,product_id) values('${product_name}','${description}','${source_image}',${actual_price},${price_offered},${pe_id},${ce_id},${id})`;
  let valid = validateProductData(
    product_name,
    description,
    source_image,
    actual_price,
    price_offered,
    pe_id,
    ce_id
  );
  if (!valid) {
    return res.render("addProductResult", { valid });
  }
  await client.query(queryText);
  res.render("addProductResult", { valid });
});

app.get("/products/editProduct/:id", async (req, res) => {
  const { id } = req.params;
  const { rows } = await client.query(
    `select * from pht_db.product_details where product_id=${id}`
  );
  res.render("editProduct", { product: rows[0] });
});

app.patch("/products/editProduct/:id", async (req, res) => {
  const { id } = req.params;
  const {
    product_name,
    description,
    source_image,
    actual_price,
    price_offered,
    pe_id,
    ce_id,
  } = req.body;
  const queryText = `update pht_db.product_details set product_name='${product_name}',description='${description}',source_image='${source_image}',actual_price='${actual_price}',price_offered='${price_offered}',ce_id=${ce_id},pe_id=${pe_id} where product_id=${id}`;
  let valid = validateProductData(
    product_name,
    description,
    source_image,
    actual_price,
    price_offered,
    pe_id,
    ce_id
  );
  if (!valid) {
    return res.render("editProductResult", { valid });
  }
  await client.query(queryText);
  res.render("editProductResult", { valid });
});

app.delete("/products/deleteProduct/:id", async (req, res) => {
  const { id } = req.params;
  const queryText = `delete from pht_db.product_details where product_id=${id}`;
  await client.query(queryText);
  res.redirect("/products");
});

//queries
app.get("/queries", (req, res) => {
  res.render("queryInput");
});

app.post("/queries", async (req, res) => {
  const { query } = req.body;
  let err = false;
  if (query.length === 0) {
    err = true;
    return res.render("queryResult", { err, error: "Query Can't be empty" });
  }
  try {
    const { rows } = await client.query(query);
    res.render("queryResult", { err, rows });
  } catch (error) {
    err = true;
    res.render("queryResult", { err, error });
  }
});

//middleware which will run when no above routes will hit
app.use((req, res, next) => {
  return res.status(404).render("errorPage");
});

app.listen(80, () => {
  console.log("App serving on port 80");
});
