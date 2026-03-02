// import bcrypt from "bcryptjs"; 
// import jwt from "jsonwebtoken"; 
// import User from "../models/User.js"; 
// export const signupUser = async (req, res) => { 
//   try { const { name, email, password } = req.body; 
//   const existingUser = await User.findOne({ email }); 
//   if (existingUser) return res.status(400).json({ message: "User already exists." }); 
//   const hashed = await bcrypt.hash(password, 10); 
//   const newUser = await User.create({ name, email, password: hashed }); 
//   res.json({ message: "Signup successful!", user: { name, email } }); 
// } catch (err) { res.status(500).json({ message: "Server error", error: err.message });
//  } };
 
//  export const loginUser = async (req, res) => { 
//   try { const { email, password } = req.body; 
//   const user = await User.findOne({ email }); 
//   if (!user) return res.status(400).json({ message: "User not found" }); 
//   const match = await bcrypt.compare(password, user.password); 
//   if (!match) return res.status(401).json({ message: "Invalid password" }); 
//   const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "2h", }); 
//   res.json({ message: "Login successful", token, user: { name: user.name } });
//  } catch (err) { res.status(500).json({ message: "Server error", error: err.message }); } };