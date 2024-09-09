var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on('error', () => console.log("Error in connecting to the Database"));
db.once('open', () => console.log("Connected to Database"));

const expenseSchema = new mongoose.Schema({
    Category: String,
    Amount: Number,
    Info: String,
    Date: Date
});
const Expense = mongoose.model('Expense', expenseSchema);

app.post("/add", async (req, res) => {
    try {
        const { category_select, amount_input, info, date_input } = req.body;
        const data = {
            Category: category_select,
            Amount: parseFloat(amount_input),
            Info: info,
            Date: new Date(date_input)
        };
        const newExpense = new Expense(data);
        await newExpense.save();
        res.redirect('/get');
    } catch (error) {
        res.status(500).send("Error inserting record");
    }
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/get', async (req, res) => {
    try {
        const expenses = await Expense.find({});
        let totalAmount = 0;

        let tableRows = expenses.map(expense => {
            if (expense.Category === 'Income') {
                totalAmount += expense.Amount;
            } else if (expense.Category === 'Expense') {
                totalAmount -= expense.Amount;
            }

            return `
                <tr>
                    <td>${expense.Category}</td>
                    <td>${expense.Amount.toFixed(2)}</td>
                    <td>${expense.Info}</td>
                    <td>${new Date(expense.Date).toLocaleDateString()}</td>
                </tr>
            `;
        }).join('');

        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Expenses and Incomes</title>
            </head>
            <body>
                <h1>Expenses and Incomes List</h1>
                <table border="1">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Info</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4">Total: ${totalAmount.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </body>
            </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        res.status(500).send("Error fetching records");
    }
});

app.listen(5000, () => {
    console.log("Listening on port 5000");
});
