import { json } from "stream/consumers";
import foodModel from "../models/foodModel.js";
import fs from "fs";

//add food item

const addFood = async (req, res) => {
  let image = `${req.file.filename}`;
  const food = new foodModel({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    image: image,
    category: req.body.category,
  });
  try {
    await food.save();
    res.json({ success: true, message: "Food Added" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Failed to add food" });
  }
};

const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    res.json({ success: true, data: foods });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Failed to fetch food items" });
  }
};

const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id);
    fs.unlinkSync(`uploads/${food.image}`, () => {});
    await foodModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Food removed" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Failed to remove food item" });
  }
};
export { addFood, listFood, removeFood };
