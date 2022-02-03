const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require('lodash');
const mongoose = require("mongoose");
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

// Defigning Schema For Default Today PAge
const todoSchema = mongoose.Schema({
  name: String,
});

//Defigning Model
const Item = mongoose.model("Item", todoSchema);

//Creating Document
const item1 = new Item({
  name: "Welcome To Do List",
});
const item2 = new Item({
  name: "Hit the + icon to add items",
});
const item3 = new Item({
  name: "<---- Click here to delete the item",
});

const defaultItems = [item1, item2, item3];

//Defigning Schema for  Custom Pages
const listSchema = mongoose.Schema({
  name: String,
  items: [todoSchema],
});

//Custom Model
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (err) {
      console.log(err);
    } else if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Pushed to DB Successfully !!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", NewItem: foundItems });
    }
  });
});

app.post("/", (req, res) => {
  let itemName = req.body.newItem;
  let listName = req.body.addBtn;
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundItem) => {
      foundItem.items.push(item);
      foundItem.save((err) => {
        if (err) console.log(err);
        else res.redirect("/" + listName);
      });
    });
  }
});

//get for Custom todo list
app.get("/:customListName", (req, res) => {
  let paraName =_.capitalize(req.params.customListName);
  List.findOne({ name: paraName }, (err, foundlist) => {
    if (!err) {
      if (!foundlist) {
        const list = new List({
          name: paraName,
          items: defaultItems,
        });
        list.save((err) => {
          if (err) res.redirect("/");
          else res.redirect("/" + paraName);
        });
      } else {
        res.render("list", {
          listTitle: foundlist.name,
          NewItem: foundlist.items,
        });
      }
    }
  });
});

//Deleting items
app.post("/del", (req, res) => {
  const itemID = req.body.checkbox;
  const titleName = req.body.titleName;
  
  if (titleName === "Today") {
    Item.findByIdAndRemove(itemID, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted Item SuccessFully !");
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: titleName },
      { $pull: { items: { _id: itemID } } },
      function (err, result) {
        if(!err) res.redirect('/' + titleName);
      });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

app.listen(port, () => {
  console.log("Server is running on port : "+port);
});
