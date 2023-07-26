const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
app.use(express.json());

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is started Successfully");
    });
  } catch (e) {
    console.log(`Database Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

//API 1
app.get("/states/", async (request, response) => {
  const stateQuery = `
    SELECT
    * 
    FROM 
    state;`;
  const listState = await db.all(stateQuery);
  response.send(
    listState.map((each) => ({
      stateId: each.state_id,
      stateName: each.state_name,
      population: each.population,
    }))
  );
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT 
    * 
    FROM 
    state 
    WHERE
     state_id=${stateId};`;
  const getSpecificState = await db.get(stateQuery);
  response.send({
    stateId: getSpecificState.state_id,
    stateName: getSpecificState.state_name,
    population: getSpecificState.population,
  });
});

//API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
  INSERT INTO
    district (district_name,state_id,cases,cured,active,deaths)
  VALUES 
    (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});
//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetails = `
    SELECT
    * 
    FROM 
    district
    WHERE 
     district_id=${districtId};`;
  const listArray = await db.get(getDistrictDetails);
  response.send({
    districtId: listArray.district_id,
    districtName: listArray.district_name,
    stateId: listArray.state_id,
    cases: listArray.cases,
    cured: listArray.cured,
    active: listArray.active,
    deaths: listArray.deaths,
  });
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM 
     district 
     WHERE 
       district_id=${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  console.log(districtName);
  const updateQuery = `
  UPDATE 
    district
    SET 
     (
         district_name='${districtName}',
         state_id=${stateId},
         cases=${cases},
         cured=${cured},
         active=${active},
         deaths=${deaths},
     )
     WHERE 
     district_id=${districtId};`;

  await db.run(updateQuery);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const totalQuery = `
    SELECT SUM(cases),SUM(cured),SUM(active),SUM(deaths)
    FROM 
     district
    WHERE 
     state_id=${stateId}
     Group BY 
      state_id;
    `;

  const listDetails = await db.get(totalQuery);
  response.send({
    totalCases: listDetails["SUM(cases)"],
    totalCured: listDetails["SUM(cured)"],
    totalActive: listDetails["SUM(active)"],
    totalDeaths: listDetails["SUM(deaths)"],
  });
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateIDQuery = `
  SELECT 
  state_id
  FROM district
  WHERE 
  district_id=${districtId};`;
  const { state_id } = await db.get(stateIDQuery);
  const stateNameQuery = `
  SELECT 
   state_name
  FROM state
  WHERE 
  state_id=${state_id};`;
  const { state_name } = await db.get(stateNameQuery);
  response.send({ stateName: state_name });
});
module.exports = app;
