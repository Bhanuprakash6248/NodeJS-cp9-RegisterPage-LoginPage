const express = require('express')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const path = require('path')

const app = express()
app.use(express.json())

let db = null
const dbPath = path.join(__dirname, 'userData.db')

//Initalising the DB and Server

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const validatePassword = password => {
  return password.length > 4
}

// API 1 ->Register
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `
  SELECT *
  FROM 
    user
  WHERE
    username ='${username}';
  `;
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    const createQuery = `
      INSERT INTO
        user(username,name,password,gender)
      VALUES(
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
      ); `;
    if (validatePassword(password)) {
      await db.run(createQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//API 2 -> \
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `
  SELECT *
  FROM 
    user
  WHERE
    username ="${username}";
  `
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.send('Login success!')
    } else {
      resposne.send(400)
      response.send('Invalid password')
    }
  }
})
