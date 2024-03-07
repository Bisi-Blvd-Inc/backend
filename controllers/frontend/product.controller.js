const productService = require("../../services/product.service");
const productModal = require("../../models/product");
const inventoryService = require("../../services/inventory.service");
const mongoose = require("mongoose");

const createProduct = async (req, res) => {
  try {
    const { quantity, price, inventoryId, userId } = req.body;
    const createdBy = req._user;
    const productData = {
      quantity: quantity,
      price: price,
      inventoryId: inventoryId,
      userId: userId,
      addedBy: createdBy,
    };

    const inventory = await inventoryService.getInventoryById(inventoryId);

    if (inventory?.productstock < quantity) {
      return res.status(400).json({
        success: true,
        message: inventory?.productstock === 0
          ? "Out of Stock"
          : `Only ${inventory?.productstock} Stock is available`,
      });
    }

    const updatedStock = inventory.productstock - quantity;
    const updateResult = await inventoryService.update(inventoryId, { productstock: updatedStock });
    const createdProduct = await productService.post(productData);

    return res.status(200).json({
      success: true,
      message: "Product added successfully",
      data: createdProduct,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await productService.getAll({ userId: id });

    const data = response.map(product => {
      const { _id, quantity, price, inventoryId, userId, addedBy, createdAt, updatedAt, __v } = product;
      return {
        _id,
        quantity,
        price,
        inventory: inventoryId,
        userId,
        addedBy,
        createdAt,
        updatedAt,
        __v
      };
    });

    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Data get successfully",
        data: data,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const deleteProductById = async (req, res) => {
  try {
    const id = req.params.id;
    const response = await productService.deleteById({ _id: id });
    if (response) {
      return res.status(200).json({
        success: true,
        message: "Deleted Successfully",
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No Product Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const searchProductByDateAndName = async (req, res) => {
  try {
    let { date, text, id } = req.query;
    let trimmedText = text.trim();
    const regex = new RegExp(trimmedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const query = {};
    if (date) {
      query['createdAt'] = date;
    }
    if (text) {
      query['inventory.name'] = regex;
    }
    if (id) {
      query['userId'] = mongoose.Types.ObjectId(id);
    }

    const response = await productModal.aggregate([
      {
        '$project': {
          'createdAt': {
            '$dateToString': {
              'format': '%Y-%m-%d',
              'date': '$createdAt'
            }
          },
          'inventoryId': 1,
          'quantity': 1,
          'price': 1,
          'userId': 1
        }
      },
      {
        '$lookup': {
          'from': 'inventories',
          'localField': 'inventoryId',
          'foreignField': '_id',
          'as': 'inventory'
        }
      },
      {
        '$unwind': '$inventory'
      },
      {
        $match: query,
      },
      {
        '$project': {
          'createdAt': 1,
          'inventoryId': 1,
          'quantity': 1,
          'price': 1,
          'inventory.isDeleted': 1,
          'inventory.userId': 1,
          'inventory.name': 1,
          'inventory.productstock': 1,
          'inventory.price': 1,
          'inventory.createdAt': 1,
          'inventory.updatedAt': 1,
          'inventory.__v': 1
        }
      }
    ]);

    if (response) {
      return res.status(200).json({
        success: true,
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No Data Found',
      });
    }
  } catch (error) {
    return res.status(500).json({
      data: error,
      message: error.message,
      success: false,
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  deleteProductById,
  searchProductByDateAndName,
};
