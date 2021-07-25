const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes/patient');
const routes1 = require('./routes/hospital');
const db = require('./config/key').URL;
const bodyParser = require('body-parser');
mongoose.connect(db, { useNewUrlParser: true })
    .then(() => console.log('connected'))
    .catch(err => {console.log(err);})
const app = express();
app.use(bodyParser.json());


app.use(cookieParser());
app.use(cors());

app.use(bodyParser.urlencoded({extended: true}));
app.use('/static', express.static('./public'))
app.use(express.urlencoded({ extended: false }))
app.set('view engine', 'ejs')
app.use('/patient', routes);
app.get('/', (req, res) => {res.render('index')});
app.use('/hospital', routes1)
const PORT = process.env.PORT || 3003
app.listen(PORT, () => {
    console.log('hello word', PORT);
})