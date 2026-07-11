import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 3,
      maxlength: 30,
    },

    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 20,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please enter a valid email"],
    },

    
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: 6,
        select: false,
    },
    
  profilePic: {
  type: String,
  default: "",
},
    
    bio: {
        type: String,
        default: "",
        maxlength: 150,
    },
    coverPic: {
    type: String,
    default: "",
  },
      posts: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
],

      isOnline: {
        type: Boolean,
        default: false,
      },

      lastSeen: {
        type: Date,
        default: Date.now,
      },
          
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],

    savedPosts: [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
        },
    ],
    
    likedPosts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
        },
    ],
    
    isPrivate: {
        type: Boolean,
        default: false,
    },
    followRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
   
},
{
    timestamps: true,
}
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {

  return await bcrypt.compare(enteredPassword, this.password);

};

userSchema.methods.generateToken = function () {

  return jwt.sign(
    {
      id: this._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

};

const User = mongoose.model("User", userSchema);

export default User;