const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const date = require(__dirname+"/date.js");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/todoDB", { useNewUrlParser: true });

// Defigning Schema For Default TOday PAge
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
  let listName =  req.body.addBtn;
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundItem) => {
      console.log(foundItem);
      foundItem.items.push(item);
      foundItem.save((err) => {
          if(err) console.log(err);
          else 
          res.redirect('/' + listName);
      });
    })
  }
 
});

//get for Custom todo list
app.get("/:customListName", (req, res) => {
  let paraName = req.params.customListName;
  List.findOne({name: paraName}, (err, foundlist) => {
    if (!err) {
      if (!foundlist) {
        const list = new List({
          name: paraName,
          items: defaultItems,
        });
        list.save((err) => {
          if(err) res.redirect('/');
          else res.redirect('/' + paraName);
        });
      } else {
       res.render('list', { listTitle: foundlist.name, NewItem: foundlist.items });
      }
    } 
  });
});


//Deleting items 
app.post("/del", (req, res) => {
  const itemID = req.body.checkbox;
  console.log(itemID);
  Item.findByIdAndRemove(itemID, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Deleted Item SuccessFully !");
    }
    res.redirect("/");
  });
});


app.listen(5500, () => {
  console.log("Server is running on port 5500");
});
