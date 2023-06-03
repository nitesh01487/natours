const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! Shutting Down...');
    console.log(err)
    process.exit(1);
});

dotenv.config({path: './config.env'});
const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);



// for connecting database
mongoose
    // for database running locally
    // .connect(process.env.DATABASE_LOCAL, {
    // for database running at remotly
    .connect(DB, {
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false
    useNewUrlParser: true,
    useCreateIndex: true,
    autoIndex: true, //this is the code I added that solved it all
    keepAlive: true,
    poolSize: 10,
    bufferMaxEntries: 0,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4, skip trying IPv6
    useFindAndModify: false,
    useUnifiedTopology: true
    }).then(() => console.log('DB connection successful!'))
    // .catch(err => console.log('ERROR'));
    // unhandled rejection;
    



// console.log(app.get('env')); // by default it is 'development'
// console.log(process.env);
// node js can run on different environment
// they are global and are used to set the env
// i.e production env or development env
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});


{// mac
// while jonas is using the mac the command to change the environment variables is different 
// NODE_ENV=development nodemon server.js

// window
// so, instead of running command for production/ development
// NO
// use
// $env:NODE_ENV="production"
// and then 
// nodemon server.js
}

{
    // or simply run the through the package.json command
}

{
    // we will continue to format the code using prettier using some eslint rules
}

// we can also install this thing in file
// npm i eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb eslint-plugin-node eslint-plugin-import eslint-plugin-jsx-ally eslint-plugin-react --save-dev

// prettier is code formatter
// eslint is all about coding rules

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! Shutting Down...');
    console.log(err);
    console.log(err.name, err.message);
    // we will close the server gracefully i.e, we first make the server to listen all the pending and hanging request to listen and respond and then we will close the server with the help of server.close()
    server.close(() =>{
        process.exit(1); // 0 success // 1 uncaught exception
    })
})
