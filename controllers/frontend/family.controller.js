const familyService = require("../../services/family.service");
const customerService = require("../../services/customer.service");
const familyModal = require("../../models/family");
const { pick } = require("lodash");
const checkRelation = (userrelation, relation) => {
  for (const iterator of userrelation) {
    if (relation == iterator.relation && (relation == "Father" || relation == "Mother")) return true
  }
  return false
}
const create = async (req, res) => {
  try {
    const { users, relation, addedByuser } = req.body;


    const existingRelation = await familyModal.findOne({
      addedByUser: addedByuser,
      users: users
    });
    const userRelations = await familyModal.find({
      addedByUser: addedByuser
    });

    const userId = req._user;
    if (!existingRelation) {
      const newRelation = {
        users: users,
        relation: relation,
        addedByowner: userId,
        addedByuser: addedByuser,

      };

      if (checkRelation(userRelations, relation))
        return res.status(400).json({
          success: true,
          message: "Relation already exists",
        });

      const createdRelation = await familyService.post(newRelation);
      console.log(createdRelation,":L:L:L:LcreatedRelation:L:L:L:L")

      return res.status(200).json({
        success: true,
        message: "Relation added successfully",
        data: createdRelation,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Relation already exists",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const getAll = async (req, res) => {
  try {
    const addedByUserId = req.params.id;
    const response = await familyService.getAll({ addedByuser: addedByUserId })
      .populate("users")
      .populate("addedBy");
    if (!response) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Data get successfully",
        data: response,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const editFamilyRelation = async (req, res, next) => {
  try {
    const { relation, userId, id } = req.body.data;
    const userrelation = await familyModal.find({ addedByuser: id });
    if (checkRelation(userrelation, relation))
      return res.status(400).json({
        success: true,
        message: "Relation already exists",
      });
    let data = pick(req.body.data, ["users", "relation"]);
    let result = await familyService.update(
      {
        addedByuser: id, _id: userId
      },
      { $set: { ...data } },
      { fields: { _id: 1 }, new: true }
    );
    return res.status(200).json({
      status: 200,
      success: true,
      data: result,
      message: "Family relation updated successfully",
    });
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await familyService.findById({ addedByuser: id });

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

const deleteById = async (req, res) => {
  try {
    const id = req.params.id;
    const response = await familyService.deleteById({ userId: req.body.userid, _id: id });
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
const getCustomerData = async (req, res) => {
  const userId = req._user;
  try {
    const customers = await customerService.findALL({ userId });

    if (customers.length > 0) {
      return res.status(200).json({
        success: true,
        data: customers,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No customer found",
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
  create,
  getAll,
  editFamilyRelation,
  deleteById,
  getById,
  getCustomerData
};
