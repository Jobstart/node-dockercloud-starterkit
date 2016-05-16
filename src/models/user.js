import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  first_name: {
    type: String
  },
  last_name: {
    type: String
  },
  favorite_number: {
    type: Number
  }
});

const UserModel = mongoose.model('User', UserSchema);

export default UserModel;
