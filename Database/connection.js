const mongoose = require('mongoose');

// config to escape mongoose warning
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// establish connection with the DB
mongoose.connect(process.env.MONGO_URI);

// respond when the connection with the backend is established
mongoose.connection.once('open', () => true).on('error', (err) => console.log(err));