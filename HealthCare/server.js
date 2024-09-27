const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const port = 3020;

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/signup');

const db = mongoose.connection;
db.once('open', () => {
    console.log("Mongodb connection successful");
});

const userSchema = new mongoose.Schema({
    fname: String,
    email: String,
    password: String,
    dob: Date,
    resetToken: String,
    resetTokenExpiry: Date
});

const Users = mongoose.model("data", userSchema);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index/index.html'));
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    try {
        const user = await Users.findOne({ email, password });
        if (user) {
            res.json({ message: "Login successful" });
        } else {
            res.status(401).json({ message: "Invalid Email or Password" });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: "Login failed" });
    }
});

app.post('/post', async (req, res) => {
    const { fname, email, password, dob } = req.body;
    if (!fname || !email || !password || !dob) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try {
        const user = new Users({
            fname,
            email,
            password,
            dob
        });
        await user.save();
        console.log(user);
        res.json({ message: "Form Submission Successful" });
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).json({ message: "Form submission failed" });
    }
});

app.post('/forgot-password', async (req, res) => {
    const { email, dob } = req.body;
    if (!email || !dob) {
        return res.status(400).json({ message: "Email and Date of Birth are required" });
    }
    try {
        const user = await Users.findOne({ email, dob });
        if (!user) {
            return res.status(400).json({ message: "User not found or Date of Birth does not match" });
        }
        const resetToken = Math.random().toString(36).substring(2);
        const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();

        // Simulate sending email
        console.log(`Reset token for ${email}: ${resetToken}`);

        res.json({ message: "Reset token generated", token: resetToken });
    } catch (error) {
        console.error('Error during forgot password:', error);
        res.status(500).json({ message: "Error during forgot password" });
    }
});

app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
    }
    try {
        const user = await Users.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }
        user.password = newPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();
        res.json({ message: "Password has been reset successfully" });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ message: "Error during password reset" });
    }
});



app.listen(port, () => {
    console.log(`Server Connected on port ${port}`);
});
