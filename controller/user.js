import User from "../models/User.js";

//GET ALL FRIENDS
export const getAllFriends = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate(
      "friends", // Populate the friends field with the necessary information
      "name email" // Fetch the 'name' and 'email' properties for the friends
    );
    if (!user) return res.status(404).json({ message: "User not found!" });

    res.status(200).json(user.friends);
  } catch (err) {
    console.error(err); // Log error to the console
    res.status(500).json({ error: err.message });
  }
};

// SEND FRIEND REQUEST
export const sendFriendRequest = async (req, res) => {
  const { userId, friendId } = req.body;
  try {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend)
      return res.status(404).json({ message: "User not found" });

    if (user.friends.includes(friendId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    if (friend.friendRequests.includes(userId)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    friend.friendRequests.push(userId);
    await friend.save();
    res.status(200).json({ message: "Friend request sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ACCEPT FRIEND REQUEST
export const acceptFriendRequest = async (req, res) => {
  const { userId, friendId } = req.body;
  try {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend)
      return res.status(404).json({ message: "User not found" });

    if (!user.friendRequests.includes(friendId)) {
      return res
        .status(400)
        .json({ message: "No friend request from this user" });
    }

    user.friends.push(friendId);
    friend.friends.push(userId);

    user.friendRequests = user.friendRequests.filter(
      (id) => id.toString() !== friendId
    );
    await user.save();
    await friend.save();

    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE FRIEND
export const deleteFriend = async (req, res) => {
  const { userId, friendId } = req.body;
  try {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend)
      return res.status(404).json({ message: "User not found" });

    user.friends = user.friends.filter((id) => id.toString() !== friendId);
    friend.friends = friend.friends.filter((id) => id.toString() !== userId);

    await user.save();
    await friend.save();

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE FRIEND REQUEST
export const deleteFriendRequest = async (req, res) => {
  const { userId, friendId } = req.body; // Ensure userId and friendId are passed in the body

  console.log(
    `Received request to delete friend request: userId=${userId}, friendId=${friendId}`
  );

  try {
    // Check if userId and friendId are provided
    if (!userId || !friendId) {
      return res
        .status(400)
        .json({ message: "userId and friendId are required" });
    }

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", user);

    // Ensure user has a friendRequests array
    if (!Array.isArray(user.friendRequests)) {
      return res
        .status(500)
        .json({ message: "Friend requests are not in an array format" });
    }

    // Remove the friendId from the user's friendRequests list
    const updatedFriendRequests = user.friendRequests.filter(
      (id) => id.toString() !== friendId
    );

    // If no matching request found, inform the user
    if (updatedFriendRequests.length === user.friendRequests.length) {
      return res
        .status(400)
        .json({ message: "Friend request not found in user's list" });
    }

    // Update the user's friendRequests list
    user.friendRequests = updatedFriendRequests;
    await user.save();

    res.status(200).json({ message: "Friend request rejected successfully" });
  } catch (err) {
    console.error("Error rejecting friend request:", err);
    res.status(500).json({ error: err.message });
  }
};

// RECOMMEND FRIENDS
export const recommendFriends = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId).populate({
      path: "friends",
      select: "_id",
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const userFriends = user.friends.map((friend) => friend._id.toString());
    const userFriendRequests = user.friendRequests.map((req) => req.toString());
    const userHobbies = user.hobbies || [];
    const recommendations = {};

    // Calculate recommendations based on mutual friends
    for (let friend of user.friends) {
      const friendWithFriends = await User.findById(friend._id).populate({
        path: "friends",
        select: "name hobbies",
      });

      for (let mutual of friendWithFriends.friends) {
        const mutualId = mutual._id.toString();

        // Exclude if mutual is the user itself, already a friend, or has sent a friend request
        if (
          mutualId === userId ||
          userFriends.includes(mutualId) ||
          userFriendRequests.includes(mutualId)
        )
          continue;

        recommendations[mutualId] = recommendations[mutualId] || {
          mutualFriends: 0,
          commonHobbies: 0,
        };

        recommendations[mutualId].mutualFriends += 1;

        // Check for common hobbies
        const commonHobbies = mutual.hobbies.filter((hobby) =>
          userHobbies.includes(hobby)
        );
        recommendations[mutualId].commonHobbies += commonHobbies.length;
      }
    }

    // Add hobby-based matches for users who aren't already in the recommendations
    const hobbyMatches = await User.find({
      _id: {
        $ne: userId,
        $nin: [...userFriends, ...userFriendRequests],
      },
      hobbies: { $in: userHobbies },
    }).select("name email hobbies");

    hobbyMatches.forEach((user) => {
      const userId = user._id.toString();
      if (!recommendations[userId]) {
        recommendations[userId] = { mutualFriends: 0, commonHobbies: 0 };
      }
      recommendations[userId].commonHobbies += 1;
    });

    // Add random users who are not already friends or requested
    const randomUsers = await User.find({
      _id: {
        $ne: userId,
        $nin: [...userFriends, ...userFriendRequests],
      },
    }).select("name email hobbies");

    randomUsers.forEach((user) => {
      const userId = user._id.toString();
      if (!recommendations[userId]) {
        recommendations[userId] = { mutualFriends: 0, commonHobbies: 0 };
      }
    });

    // Sort recommendations by mutual friends and common hobbies
    const sortedRecommendations = Object.entries(recommendations)
      .sort((a, b) => {
        if (b[1].mutualFriends !== a[1].mutualFriends)
          return b[1].mutualFriends - a[1].mutualFriends;
        if (b[1].commonHobbies !== a[1].commonHobbies)
          return b[1].commonHobbies - a[1].commonHobbies;
        return 0;
      })
      .map(([id]) => id)
      .slice(0, 5); // Limit to 5 recommendations

    // Fetch user details for the limited recommendations
    const recommendedUsers = await User.find({
      _id: { $in: sortedRecommendations },
    }).select("name email hobbies");

    if (recommendedUsers.length === 0)
      return res
        .status(404)
        .json({ message: "No friend recommendations available" });

    res.status(200).json(recommendedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SEARCH FRIEND
export const searchFriend = async (req, res) => {
  const { searchTerm, userId } = req.query; // Get userId from query params
  try {
    const users = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
          ],
        },
        { _id: { $ne: userId } }, // Exclude the logged-in user
      ],
    }).select("name email");

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET FRIEND REQUESTS
export const getFriendRequests = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate(
      "friendRequests",
      "name email"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ friendRequests: user.friendRequests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
