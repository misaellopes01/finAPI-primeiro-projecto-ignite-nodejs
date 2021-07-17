const { request, response, json } = require('express')
const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(express.json())

const customers = []

function verifyIfExistsAccount(request, response, next) {
    const { cpf } = request.headers

    const customer = customers.find((customer) => customer.cpf === cpf)
 
    if (!customer) {
        return response.status(400).json({ error: "Customer Not Found!"})
    }

    request.customer = customer

    return next()
}

function getBalance(statement){
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit'){
            return acc + operation.amount
        } else{
            return acc - operation.amount
        }
    }, 0)

    return balance
}

app.post("/account", (request, response) => {
    const { cpf, name } = request.body

    const customerAlreadyExists = customers.some(
        (customers) => customers.cpf === cpf
    )

    if (customerAlreadyExists) {
        return response.status(400).json({ error: 'Customer Already Exists!' })
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    })

    return response.status(201).send()
})

app.get("/statement", verifyIfExistsAccount, (request, response) => {
  
    const { customer } = request

    return response.json(customer.statement)
}) 

app.post("/deposit", verifyIfExistsAccount, (request, response) => {
    const { description, amount } = request.body

    const { customer } = request

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: 'credit'
    }
    
    customer.statement.push(statementOperation)
   
    return response.status(201).send()
})  

app.post("/withdraw", verifyIfExistsAccount, (request, response) => {
    const { amount } = request.body
    const { customer } = request

    const balance = getBalance(customer.statement)

    if (balance < amount){
        return response.status(400).json({ error: "Insufficient funds!"})
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: 'debit'
    }

    customer.statement.push(statementOperation)
     
    return response.status(201).send()
})

app.get("/statement/date", verifyIfExistsAccount, (request, response) => {
  
    const { customer } = request
    const { date } = request.query

    const dateFormat = new Date(date + "  00:00")

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

    return response.json(statement)
}) 

app.put("/account", verifyIfExistsAccount, (request, response) => {
    const { name } = request.body
    const { customer } = request

    customer.name = name

    return response.status(201).send()
})

app.get("/account", verifyIfExistsAccount, (request, response) => {
    const { customer } = request

    return response.json(customer)
})

app.delete("/account", verifyIfExistsAccount, (request, response) => {
    const { customer } = request

    customers.splice(customer, 1)

    return response.status(200).json(customers)
})

app.get("/balance", verifyIfExistsAccount, (request, response) => {
    const { customer } = request

    const balance = getBalance(customer.statement)

    return response.json(balance)
})

app.listen(3333, () => console.log('Ignition Started!'))