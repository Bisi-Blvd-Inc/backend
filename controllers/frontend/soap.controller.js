const userSoapservices = require("../../services/usersoap.services");
const usersoap = require('../../models/userdetailsoap')

const addSoap = async (req, res) => {
  try {
    const { level, subjective, objective, assessment, plan, additionalNotes } =
      req.body;
    const images = req.files;
    const Id = req._user;
    const imageArray = [];
    if (images && images.length > 0) {
      images.forEach((element) => {
        const payload = {
          ...element,
          name: element.filename,
        };
        imageArray.push(payload);
      });
    }
    const obj = {
      userBookingId: req.params.id,
      level: level,
      subjective: subjective,
      objective: objective,
      assessment: assessment,
      plan: plan,
      additionalNotes: additionalNotes,
      files: imageArray,
      addedBy :  Id
    };

    const soapResult = await userSoapservices.post(obj);
    return res.status(200).json({
      success: true,
      message: "Added successfully",
      data: soapResult,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      data: {},
      success: false,
    });
  }
};

const getSoap = async (req, res) => {
  try {
    let { id } = req.params;
    const response = await userSoapservices.getSoapwithId({
      _id : id,
    });
    if (!response) {
      return res.status(200).json({
        message: "User not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Users get successfully",
        data: response,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
      data: {},
      success: false,
    });
  }
};



const getAll = async (req, res) => {
  try {
    const soaps = await usersoap.find();
    console.log("Soap : "+soaps);
    res.status(200).json({ msg:soaps });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
}
const searchSoaps = async (req, res) => {
  try {
    // const { subjective, date } = req.params;
    const { subjective } = req.params;

    // const soaps = await usersoap.find({ subjective: new RegExp(subjective, 'i'), createdAt: { $gte: date } });
    const soaps = await usersoap.find({ subjective: new RegExp(subjective, 'i') });
    
    res.status(200).json({ msg: soaps });
  } catch (error) {
    console.error("Error searching soaps:", error);
    res.status(500).json({ msg: error });
  }
};


const deleteSoapById = async (req, res) => {
  try {
    const id = req.params.id;
    const response = await userSoapservices.deleteById({ _id: id });
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



const addallSoap=async(req,res)=>{
try {
  
} catch (error) {
  console.log(error)
  res.status(500).json({msg:error})
}
}



const searchSoapByDateAndName = async (req, res) => {
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

    const response = await usersoap.aggregate([
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







const updateSoap = async (req, res) => {
  try {
    const {
      level,
      subjective,
      objective,
      assessment,
      plan,
      additionalNotes,
      id,
    } = req.body;
    const images = req.files;
    const imageArray = [];
    if (images && images.length > 0) {
      images.forEach((element) => {
        const payload = {
          ...element,
          name: element.filename,
        };
        imageArray.push(payload);
      });
    }

    const obj = {
      level: level,
      subjective: subjective,
      objective: objective,
      assessment: assessment,
      plan: plan,
      additionalNotes: additionalNotes,
      files: req.body.file
        ? [
            ...imageArray,
            ...JSON.parse(req.body.file).filter(
              (item) => Object.keys(item).length !== 0
            ),
          ]
        : imageArray,
    };
    const response = await userSoapservices.update({ _id: id }, obj);
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      data: {},
      success: false,
    });
  }
};

module.exports = {
  addSoap,
  getSoap,
  updateSoap,
  getAll,
  addallSoap,
  searchSoaps,
  searchSoapByDateAndName,
  deleteSoapById
};
