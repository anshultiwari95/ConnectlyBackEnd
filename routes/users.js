import express from "express";
import {
  getAllFriends,
  sendFriendRequest,
  acceptFriendRequest,
  deleteFriend,
  deleteFriendRequest,
  searchFriend,
  recommendFriends,
  getFriendRequests,
} from "../controller/user.js";

const router = express.Router();

//GET FRIENDS
router.get("/friends/:userId", getAllFriends);

//Get FRIEND REQUEST
router.get("/friend-requests/:userId", getFriendRequests);

//SEND FRIEND REQUEST
router.post("/send", sendFriendRequest);

//ACCEPT FRIEND REQUEST
router.post("/accept", acceptFriendRequest);

//DELETE FRIEND
router.delete("/delete", deleteFriend);

//DELETE FRIEND REQUEST
router.delete("/delete-request", deleteFriendRequest);

//SEARCH FRIEND
router.get("/search", searchFriend);

//RECOMMEND FRIEND
router.post("/recommend-friends", recommendFriends);

export default router;
