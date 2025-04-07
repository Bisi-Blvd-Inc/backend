const inventoryService = require("../../services/inventory.service");
const inventoryModel = require("../../models/inventory");

const createInventory = async (req, res) => {
  try {
    let productimgs = req?.files?.map(file => file?.filename);
    const { name, productstock, service, price, estUsage, description } = req.body;
    const servises = JSON.parse(service ?? null);
    const estUsages = JSON.parse(estUsage ?? null);

    const userId = req._user;
    let newInventory = new inventoryModel({
      userId,
      name,
      productimgs,
      productstock,
      description,
      service: servises,
      price,
      estUsage: estUsages,
    });
    await newInventory.save();
    return res.status(200).json({
      success: true,
      message: "Inventory added successfully",
      data: newInventory,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      data: {},
      success: false,
    });
  }
};

const getAllInventory = async (req, res) => {
  try {
    let userId = req._user;
    const response = await inventoryService.get(userId);
    const count = await inventoryModel.count({ isDeleted: false });
    if (!response) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Data get successfully",
        data: response,
        totalCount: count,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const getSingleInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await inventoryService.getInventoryById(id);
    if (!response) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Data get successfully",
        data: response,
        totalCount: response.length,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const editInventory = async (req, res) => {
  try {
    const { name, price, productstock, productimgs, service, estUsage, description, existingImgs } = req.body;
    const Id = req.params.id;

    if (req.files) {
      const data = {
        name: name,
        price: price,
        productstock: productstock,
        service: JSON.parse(service),
        estUsage: JSON.parse(estUsage),
        description: description,
      };

      let productImgs = req.files.map(file => file.filename);
      const existingImages = JSON.parse(existingImgs || '[]');
      const allProductImgs = [...existingImages, ...productImgs];
      data.productimgs = allProductImgs;

      let result = await inventoryService.update(Id, data);
      return res.status(200).json({
        status: 200,
        success: true,
        data: result,
        message: "Updated successfully",
      });
    } else {
      const obj = {
        name: name,
        price: price,
        productimgs: productimgs,
        productstock: productstock,
        service: service,
        estUsage: estUsage,
        description: description,
      };
      let result = await inventoryService.update(Id, obj);
      return res.status(200).json({
        status: 200,
        success: true,
        data: result,
        message: "Updated successfully",
      });
    }
  } catch (error) {
    rconsole.log(error);
  }
};

const deleteInventory = async (req, res) => {
  try {
  const id = req.params.id;
    const response = await inventoryModel.updateOne({ _id: id }, { isDeleted: true });
    if (response) {
      return res.status(200).json({
        success: true,
        message: "Deleted Successfully",
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No Theme Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const searchInventory = async (req, res) => {
  try {
    let { text, pageNo, limit } = req.query;
    let text1 = text.trim()
    const regex = new RegExp(text1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const response = await inventoryModel.find({ userId: req._user, name: regex, isDeleted: false })
      .skip((pageNo - 1) * limit)
      .limit(Number(limit)).populate("service");

    if (response) {
      return res.status(200).json({
        success: true,
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No User Found",
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

const multiDeleteInventory = async (req, res) => {
  try {
    const response = await inventoryModel.deleteMany({ _id: { $in: req.body.data } });
    if (response) {
      return res.status(200).json({
        success: true,
        message: "Deleted Successfully",
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No Theme Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

module.exports = {
  createInventory,
  getAllInventory,
  editInventory,
  getSingleInventory,
  multiDeleteInventory,
  deleteInventory,
  searchInventory,
};
