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
  let {username, name, password, gender, location} = request.body
  let hashedPassword = await bcrypt.hash(password, 10)
  let selectUserQuery = `
      SELECT *
      FROM 
        user
      WHERE
        username ='${username}';`
  let dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    let createQuery = `
      INSERT INTO
        user(username,name,password,gender,location)
      VALUES(
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
      ); `
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

//API 2 -> \login
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
      response.send(400)
      response.send('Invalid password')
    }
  }
})

//API-3

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `
    SELECT *
    FROM 
      user
    WHERE
      username ="${username}";
    `
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    // user not Resgistred
    response.status(400)
    response.send('user not register')
  } else {
    //valid user
    const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password)
    if (isPasswordMatched === true) {
      // checks the passwords
      const passwordLength = newPassword.length
      if (passwordLength < 5) {
        // checks the lenght of password <5
        response.status(400)
        response.send('Password is too short')
      } else {
        //Update password
        const encryptPassword = await bcrypt.hash(newPassword, 10)
        const updatedPasswordQuery = `
            UPDATE user
            SET
              password = '${encryptPassword}'
            WHERE
              username ='${username}';
          `
        await db.run(updatedPasswordQuery)
        response.send(200)
        response.send('Password updated')
      }
    } else {
      // unmatched password
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
