const express = require('express');
const jwt = require('jsonwebtoken');
const secret = require('../config/key').secret
const generateToken = (res, username, _id) => {
    const expiration = 604800000;
    const token = jwt.sign({ username, _id }, secret);
    console.log(token);
    return res.cookie('token', token, {
        expires: new Date(Date.now() + expiration)
    });
};
const getUsername = async (req) => {


}
const verifyToken = async (req, res, next) => {
    const token = req.cookies.token || '';
    try {
        if (!token) {
            return res.status(401).json('You need to Login')
        }
        const decrypt = await jwt.verify(token, secret);
        req.user = {
            username: decrypt.username,
            _id: decrypt._id,
        };
      //  console.log(req.user)
        next();
    } catch (err) {
        return res.status(500).json(err.toString());
    }
};
module.exports = { generateToken, verifyToken ,getUsername}