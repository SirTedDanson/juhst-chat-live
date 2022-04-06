const { AuthenticationError } = require('apollo-server-express');
const { User, Message } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select('-__v -password')
      

        return userData;
      }

      throw new AuthenticationError('Not logged in');
    },

    // get all users
    users: async () => {
      return User.find()
        .select('-__v -password')
        .populate("messages");
        },
    // get all users
    user: async (parent, { username }) => {
      return User.findOne({ username })
        .select('-__v -password')
        .populate("messages");
    },

    // get message with param option username
    messages: async (parent, { username }) => {
      const params = username ? { username } : {};
      return Message.find(params).sort({ createdAt: -1 });
    },

    // get a single message
    message: async (parent, { _id }) => {
      return Message.findOne({ _id });
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
    
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const token = signToken(user);
      return { token, user };
    },
    sendMessage: async (parent, args, context) => {
      if (context.user) {
        const message = await Message.create({ ...args, username: context.user.username });

        await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $push: { messages: message._id } },
          { new: true }
        );

        return message;
      }

      throw new AuthenticationError('You need to be logged in!');
    },

  }
};

module.exports = resolvers;
