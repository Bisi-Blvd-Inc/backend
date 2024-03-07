const usersService = require("../../services/users.services");
const { pick } = require("lodash");
const userCollection = require("../../models/user.js");
const rejectImportsModel = require("../../models/rejectImports");
const PersonalBudgetModal = require("../../models/personalBudget");
const rejectImportModal = require("../../models/rejectImports");
const { generateToken } = require("../../helpers/helper");
const bcrypt = require("bcrypt");
const { sendMailForUser } = require("../../helpers/helper");
const fs = require("fs");
const csv = require("csv-parser");

const createUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await usersService.findEmail({ email: email, role: 2 });

    if (user && user.isDeleted === false) {
      return res.status(400).json({
        status: 400,
        message: "Email Already Exists",
      });
    }

    bcrypt.hash(password.toString(), 10, async (err, hash) => {
      try {
        if (err) {
          return res.status(400).json({
            error: "Something went wrong",
          });
        }

        const newUser = {
          ...req.body,
          password: hash,
        };

        const createdUser = await usersService.post(newUser);
        const token = await generateToken(createdUser);

        const emailresponse = await sendMailForUser({
          token: token,
          email: createdUser.email,
          password: req.body.password,
        });

        return res.status(201).json({
          success: true,
          message: "Registered successfully",
          data: createdUser,
        });
      } catch (error) {
        return res.status(500).json({
          message: "Internal Server Error",
          error: error.message,
          success: false,
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
      success: false,
    });
  }
};

const getUsersWithPagination = async (req, res) => {
  try {
    let { pageNo, limit } = req.params;
    const response = await usersService
      .get(Number(pageNo), Number(limit))
      .populate("businessType");

    const count = await userCollection.countDocuments({ role: 2 });

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
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const getbyid = async (req, res) => {
  const { id } = req.params
  try {
    const response = await userCollection.find({ _id: id })
      .populate("businessType");
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

const UsersEdit = async (req, res, next) => {
  try {
    const Id = req.params.id;
    if (!Id) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Id is required",
      });
    }
    const data = pick(req.body, [
      "businessName",
      "firstName",
      "email",
      "password",
      "phone",
      "mobile",
      "state",
      "businessType",
      "referred",
    ]);

    const result = await usersService.update(
      { _id: Id, role: 2 },
      { $set: { ...data } },
      { fields: { _id: 1 }, new: true }
    );

    if (!result) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "Only admin can modify user",
      });
    }

    return res.status(200).json({
      status: 200,
      success: true,
      data: result,
      message: "User updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
      success: false,
    });
  }
};


const deleteUser = async (req, res) => {
  const id = req.params.id;

  try {
    const response = await userCollection.updateOne(
      { _id: id, role: 2 },
      { $set: { isDeleted: true } }
    );

    if (response.nModified > 0) {
      return res.status(200).json({
        success: true,
        message: "User Deleted Successfully",
        data: response,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No User Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};


const UserSearch = async (req, res) => {
  try {
    let { page, limit, text } = req.query;
    let text1 = text.trim();
    const regex = new RegExp(text1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page number or limit.",
      });
    }

    const totalCount = await userCollection.countDocuments({
      firstName: regex,
      role: 2,
      isDeleted: false,
    });

    const totalPages = Math.ceil(totalCount / limit);
    const skipRecords = (page - 1) * limit;

    const response = await userCollection
      .find({ firstName: regex, role: 2, isDeleted: false })
      .skip(skipRecords)
      .limit(limit)
      .populate("businessType")
      .populate("addedBy");

    if (response.length > 0) {
      return res.status(200).json({
        success: true,
        data: response,
        count: totalCount,
        totalPages: totalPages,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No User Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};


const usersStatus = async (req, res) => {
  try {
    const conditions = {
      _id: req.params.id,
    };
    if (req.params.status == "false") {
      const payload = {
        isDeleted: true
      };
      let result = await usersService.updatestatus(conditions, payload);

      return res.status(200).json({
        message: "User disabled successfully",
        status: 201,
        data: result,
      });
    } else {
      const payload = {
        isDeleted: false,
      };
      let result = await usersService.updatestatus(conditions, payload);
      return res.status(200).json({
        message: "User enabled successfully",
        status: 200,
        data: result
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error,
      status: 500,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const response = await usersService.getAllUser().populate("businessType");

    if (!response) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: " All user get successfully",
        data: response,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const onImport = async (req, res) => {
  const { userId } = req.body;
  try {
    if (req.file && userId) {
      const filename = req.file.filename;
      let singleRecord = []
      let errors = [];
      let status = true;
      let validObj = {
        addedBy: userId,
        housing: {
          mortgage: 0,
          propertyTax: 0,
          homeMaintenance: 0,
          homeowerInsurance: 0,
          electric: 0,
          gas: 0,
          water: 0,
          cable: 0,
          talephone: 0,
          other: 0,
        },
        transportation: {
          autoPayment: 0,
          autoInsurance: 0,
          gas: 0,
          maintenance: 0,
          LicenseRegistration: 0,
          ParkingTollBusTrain: 0,
          Others: 0,
        },
        houseHold: {
          groceries: 0,
          personalCare: 0,
          ClothingDryCleaning: 0,
          domesticHelp: 0,
          professionaldues: 0,
          dependentChildCare: 0,
          educationSchool: 0,
          cashAllowances: 0,
          others: 0,
        },
        loanPayments: {
          creditCardPayment: 0,
          otherLoanPayment: 0,
          savingInvesting: 0,
          others: 0,
        },
        personalInsurance: {
          healthInsurance: 0,
          lifeInsurance: 0,
          disabilityIncomeInsurance: 0,
          healthCareInsurance: 0,
          medicalDentalVisionDrug: 0,
          others: 0,
        },
        discretionary: {
          diningOut: 0,
          recreationClubDues: 0,
          moviesSportingEvents: 0,
          hobbies: 0,
          vacationTravel: 0,
          childCare: 0,
          giftContributions: 0,
          others: 0,
        },
        companyExpenses: {
          rent: 0,
          gas: 0,
          companyWater: 0,
          electricity: 0,
          cellular: 0,
          internet: 0,
          marketing: 0,
        },
      };

      fs.createReadStream(`${__dirname}/../../uploads/csv/${filename}`)
        .pipe(
          csv({
            mapHeaders: ({ header, index }) => header.trim(),
          })
        )
        .on("data", (data) => {
          if (data && Object.keys(data).length >= 2) {
            let numRegex = /^\d*[.]?\d*$/;

            if (
              data.keys &&
              data.keys.length > 0 &&
              data.keys != "housing" &&
              data.keys != "transportation" &&
              data.keys != "houseHold" &&
              data.keys != "loanPayments" &&
              data.keys != "personalInsurance" &&
              data.keys != "discretionary" &&
              data.keys != "companyExpenses"
            ) {
              if (!numRegex.test(data.value)) {
                errors.push(data.keys + "  field data is not correct or empty");
                status = false;
              }
            }
            if (status) {
              if (data.keys == "personalSalary") {
                validObj.income.personalSalary = data.value;
              }
              if (data.keys == "personalBonus") {
                validObj.income.personalBonus = data.value;
              }
              if (data.keys == "personalOtherIncome") {
                validObj.income.personalOtherIncome = data.value;
              }
              if (data.keys == "spouseSalary") {
                validObj.income.spouseSalary = data.value;
              }
              if (data.keys == "SpouseBonus") {
                validObj.income.SpouseBonus = data.value;
              }
              if (data.keys == "spouseOtherIncome") {
                validObj.income.spouseOtherIncome = data.value;
              }
              if (data.keys == "mortgage") {
                validObj.housing.mortgage = data.value;
              }
              if (data.keys == "propertyTax") {
                validObj.housing.propertyTax = data.value;
              }
              if (data.keys == "homeMaintenance") {
                validObj.housing.homeMaintenance = data.value;
              }
              if (data.keys == "homeowerInsurance") {
                validObj.housing.homeowerInsurance = data.value;
              }
              if (data.keys == "electric") {
                validObj.housing.electric = data.value;
              }
              if (data.keys == "gas") {
                validObj.housing.gas = data.value;
              }
              if (data.keys == "water") {
                validObj.housing.water = data.value;
              }
              if (data.keys == "cable") {
                validObj.housing.cable = data.value;
              }
              if (data.keys == "talephone") {
                validObj.housing.talephone = data.value;
              }
              if (data.keys == "other") {
                validObj.housing.other = data.value;
              }

              if (data.keys == "autoPayment") {
                validObj.transportation.autoPayment = data.value;
              }
              if (data.keys == "autoInsurance") {
                validObj.transportation.autoInsurance = data.value;
              }
              if (data.keys == "transportationGas") {
                validObj.transportation.transportationGas = data.value;
              }
              if (data.keys == "maintenance") {
                validObj.transportation.maintenance = data.value;
              }
              if (data.keys == "LicenseRegistration") {
                validObj.transportation.LicenseRegistration = data.value;
              }
              if (data.keys == "ParkingTollBusTrain") {
                validObj.transportation.ParkingTollBusTrain = data.value;
              }
              if (data.keys == "Others") {
                validObj.transportation.Others = data.value;
              }

              if (data.keys == "groceries") {
                validObj.houseHold.groceries = data.value;
              }
              if (data.keys == "personalCare") {
                validObj.houseHold.personalCare = data.value;
              }
              if (data.keys == "ClothingDryCleaning") {
                validObj.houseHold.ClothingDryCleaning = data.value;
              }
              if (data.keys == "domesticHelp") {
                validObj.houseHold.domesticHelp = data.value;
              }
              if (data.keys == "professionaldues") {
                validObj.houseHold.professionaldues = data.value;
              }
              if (data.keys == "dependentChildCare") {
                validObj.houseHold.dependentChildCare = data.value;
              }
              if (data.keys == "educationSchool") {
                validObj.houseHold.educationSchool = data.value;
              }
              if (data.keys == "cashAllowances") {
                validObj.houseHold.cashAllowances = data.value;
              }
              if (data.keys == "others") {
                validObj.houseHold.others = data.value;
              }

              if (data.keys == "creditCardPayment") {
                validObj.loanPayments.creditCardPayment = data.value;
              }
              if (data.keys == "otherLoanPayment") {
                validObj.loanPayments.otherLoanPayment = data.value;
              }
              if (data.keys == "savingInvesting") {
                validObj.loanPayments.savingInvesting = data.value;
              }
              if (data.keys == "others") {
                validObj.loanPayments.others = data.value;
              }

              if (data.keys == "healthInsurance") {
                validObj.personalInsurance.healthInsurance = data.value;
              }

              if (data.keys == "lifeInsurance") {
                validObj.personalInsurance.lifeInsurance = data.value;
              }

              if (data.keys == "disabilityIncomeInsurance") {
                validObj.personalInsurance.disabilityIncomeInsurance =
                  data.value;
              }

              if (data.keys == "healthCareInsurance") {
                validObj.personalInsurance.healthCareInsurance = data.value;
              }

              if (data.keys == "medicalDentalVisionDrug") {
                validObj.personalInsurance.medicalDentalVisionDrug = data.value;
              }

              if (data.keys == "others") {
                validObj.personalInsurance.others = data.value;
              }

              if (data.keys == "diningOut") {
                validObj.discretionary.diningOut = data.value;
              }
              if (data.keys == "recreationClubDues") {
                validObj.discretionary.recreationClubDues = data.value;
              }
              if (data.keys == "moviesSportingEvents") {
                validObj.discretionary.moviesSportingEvents = data.value;
              }
              if (data.keys == "hobbies") {
                validObj.discretionary.hobbies = data.value;
              }
              if (data.keys == "vacationTravel") {
                validObj.discretionary.vacationTravel = data.value;
              }
              if (data.keys == "childCare") {
                validObj.discretionary.childCare = data.value;
              }
              if (data.keys == "giftContributions") {
                validObj.discretionary.giftContributions = data.value;
              }
              if (data.keys == "others") {
                validObj.discretionary.others = data.value;
              }

              if (data.keys == "rent") {
                validObj.companyExpenses.rent = data.value;
              }
              if (data.keys == "companyGas") {
                validObj.companyExpenses.companyGas = data.value;
              }
              if (data.keys == "companyWater") {
                validObj.companyExpenses.companyWater = data.value;
              }
              if (data.keys == "electricity") {
                validObj.companyExpenses.electricity = data.value;
              }
              if (data.keys == "cellular") {
                validObj.companyExpenses.cellular = data.value;
              }
              if (data.keys == "internet") {
                validObj.companyExpenses.internet = data.value;
              }
              if (data.keys == "marketing") {
                validObj.companyExpenses.marketing = data.value;
              }
            }
            singleRecord.push(data);
          }
        })
        .on("end", async () => {
          if (singleRecord) {
            let csvStatus = true;
            let csvKeys = Object.keys(singleRecord);
            if (csvKeys.length < 3) {
              csvStatus = false;
            } else if (csvKeys.includes("keys") && csvKeys.includes("value")) {
              csvStatus = true;
            } else {
              csvStatus = true;
            }
            if (csvStatus) {
              if (errors && errors.length > 0) {
                const inValidRecords = {
                  userId: userId,
                  error: errors,
                };
                let rejects = rejectImportsModel.findOne({ userId: userId });
                if (rejects) {
                  await rejectImportsModel
                    .deleteMany({ userId: userId })
                    .then(() => {
                      rejectImportsModel.create(inValidRecords).then((ress) => {
                      });
                    })
                    .catch(console.log);
                } else {
                  await rejectImportsModel
                    .create(inValidRecords)
                    .then((ress) => {
                      console.log(ress);
                    });
                }

                return res.json({
                  status: 400,
                  message: "Data is not correct in CSV",
                  error: errors,
                });
              } else {
                const exists = await PersonalBudgetModal.findOne({
                  addedBy: userId,
                });
                if (exists) {
                  return res.json({
                    status: 400,
                    message: "User is already exists",
                  });
                } else {
                  function extractNumericValue(value) {
                    return parseFloat(value.replace('$', '').trim()) || 0;
                  }
                  let validObj1 = {
                    addedBy: userId,
                    housing: {
                      mortgage: extractNumericValue(singleRecord[1].value),
                      propertyTax: extractNumericValue(singleRecord[2].value),
                      homeMaintenance: extractNumericValue(singleRecord[3].value),
                      homeowerInsurance: extractNumericValue(singleRecord[4].value),
                      electric: extractNumericValue(singleRecord[5].value),
                      gas: extractNumericValue(singleRecord[6].value),
                      water: extractNumericValue(singleRecord[7].value),
                      cable: extractNumericValue(singleRecord[8].value),
                      talephone: extractNumericValue(singleRecord[9].value),
                      other: extractNumericValue(singleRecord[10].value),
                    },
                    transportation: {
                      autoPayment: extractNumericValue(singleRecord[15].value),
                      autoInsurance: extractNumericValue(singleRecord[16].value),
                      transportationGas: extractNumericValue(singleRecord[17].value),
                      maintenance: extractNumericValue(singleRecord[18].value),
                      LicenseRegistration: extractNumericValue(singleRecord[19].value),
                      ParkingTollBusTrain: extractNumericValue(singleRecord[20].value),
                      Others: extractNumericValue(singleRecord[21].value),
                    },
                    houseHold: {
                      groceries: extractNumericValue(singleRecord[26].value),
                      personalCare: extractNumericValue(singleRecord[27].value),
                      ClothingDryCleaning: extractNumericValue(singleRecord[28].value),
                      domesticHelp: extractNumericValue(singleRecord[29].value),
                      professionaldues: extractNumericValue(singleRecord[30].value),
                      dependentChildCare: extractNumericValue(singleRecord[31].value),
                      educationSchool: extractNumericValue(singleRecord[32].value),
                      cashAllowances: extractNumericValue(singleRecord[33].value),
                      others: extractNumericValue(singleRecord[34].value),
                    },
                    loanPayments: {
                      creditCardPayment: extractNumericValue(singleRecord[39].value),
                      otherLoanPayment: extractNumericValue(singleRecord[40].value),
                      savingInvesting: extractNumericValue(singleRecord[41].value),
                      others: extractNumericValue(singleRecord[42].value),
                    },
                    personalInsurance: {
                      healthInsurance: extractNumericValue(singleRecord[47].value),
                      lifeInsurance: extractNumericValue(singleRecord[48].value),
                      disabilityIncomeInsurance: extractNumericValue(singleRecord[50].value),
                      healthCareInsurance: extractNumericValue(singleRecord[51].value),
                      medicalDentalVisionDrug: extractNumericValue(singleRecord[52].value),
                      others: extractNumericValue(singleRecord[53].value),
                    },
                    discretionary: {
                      diningOut: extractNumericValue(singleRecord[58].value),
                      recreationClubDues: extractNumericValue(singleRecord[59].value),
                      moviesSportingEvents: extractNumericValue(singleRecord[60].value),
                      hobbies: extractNumericValue(singleRecord[61].value),
                      vacationTravel: extractNumericValue(singleRecord[62].value),
                      childCare: extractNumericValue(singleRecord[63].value),
                      giftContributions: extractNumericValue(singleRecord[63].value),
                      others: extractNumericValue(singleRecord[64].value),
                    },
                    companyExpenses: {
                      rent: extractNumericValue(singleRecord[69].value),
                      companyGas: extractNumericValue(singleRecord[70].value),
                      companyWater: extractNumericValue(singleRecord[71].value),
                      electricity: extractNumericValue(singleRecord[72].value),
                      cellular: extractNumericValue(singleRecord[73].value),
                      internet: extractNumericValue(singleRecord[74].value),
                      marketing: extractNumericValue(singleRecord[75].value),
                    },
                  };
                  const result = await PersonalBudgetModal.create(validObj1);

                  return res.json({
                    status: 200,
                    message: "File imported Successfully",
                    data: result,
                  });
                }
              }
            }

            return res.send({
              status: 200,
              message: "Import successfully",
            });
          } else {
            return res.send({
              status: 204,
              message: "Csv format is not correct",
            });
          }
        });
    } else {
      return res.json({
        status: 400,
        message: "Please select csv file and program",
      });
    }
  } catch (err) {
    return res.json({
      status: 404,
      message: err.message,
    });
  }
};
const getRejects = async (req, res) => {
  try {
    const response = await rejectImportModal.find().populate("userId");
    if (!response) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Rejects data get successfully",
        data: response,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  createUser,
  getUsersWithPagination,
  UsersEdit,
  deleteUser,
  UserSearch,
  usersStatus,
  getAllUsers,
  onImport,
  getRejects,
  getbyid
};
