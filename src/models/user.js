const mongoose = require('mongoose');
const Schema = mongoose.Schema;

userSchema = new Schema( {

    id:       String,
    email:    String, 
    name:     String,
    password: String

})

User = mongoose.model('User', userSchema)

module.exports = User