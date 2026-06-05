const crypto = require('crypto');
const Pass = require('../models/Pass.model');
const Appointment = require('../models/Appointment.model');
const Visitor = require('../models/Visitor.model');
const qrService = require('../services/qr.service');
const pdfService = require('../services/pdf.service');
const emailService = require('../services/email.service');


exports.issuePass = async (req, res, next) => {
  try {
    const appointmentId = req.params.appointmentId;
    console.log(`Issuing pass for appointment ${appointmentId}`);


    const appointment = await Appointment.findById(appointmentId)
      .populate('visitor')
      .populate('employee', 'name email');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }


    if (appointment.status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'Wait for the appointment to be approved first' });
    }


    const existingPass = await Pass.findOne({ appointment: appointment._id });
    if (existingPass) {
      return res.status(400).json({ success: false, message: 'Pass already issued for this appointment' });
    }


    const passCode = crypto.randomBytes(4).toString('hex').toUpperCase();


    const validationUrl = `http://localhost:5173/security/verify/${passCode}`;
    const qrCodeUrl = await qrService.generateQRCode(validationUrl);


    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setHours(23, 59, 59, 999);

    const pass = await Pass.create({
      appointment: appointment._id,
      passCode: passCode,
      qrCodeUrl: qrCodeUrl,
      validFrom: validFrom,
      validUntil: validUntil,
    });


    console.log("Generating simple PDF pass...");
    const pdfBuffer = await pdfService.generatePDFPass({
      visitorName: appointment.visitor.name,
      employeeName: appointment.employee.name,
      date: appointment.date,
      time: appointment.time,
      passCode: passCode,
      qrCodeUrl: qrCodeUrl
    });


    console.log("Sending email with the pass...");
    await emailService.sendEmail({
      email: appointment.visitor.email,
      subject: `Your Visitor Pass from ${appointment.employee.name}`,
      message: `Your appointment is approved. Your pass code is ${passCode}. See attached PDF.`,
      html: `
        <h2>Visitor Pass</h2>
        <p>Hello ${appointment.visitor.name},</p>
        <p>Your appointment is approved. Here is your pass code: <b>${passCode}</b></p>
        <p>Present the attached PDF to the security guard.</p>
      `,
      attachments: [{
        filename: `pass_${passCode}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });


    res.status(201).json({
      success: true,
      message: 'Pass generated and email sent successfully',
      data: pass,
    });

  } catch (error) {
    console.log("Error in issuePass:", error);
    next(error);
  }
};

exports.verifyPass = async (req, res, next) => {
  try {
    const passCode = req.params.passCode;
    console.log(`Verifying passCode ${passCode}`);

    const pass = await Pass.findOne({ passCode: passCode })
      .populate({
         path: 'appointment',
         populate: { path: 'visitor employee' }
      });


    if (!pass) {
      return res.status(404).json({ success: false, message: 'Invalid Pass Code' });
    }


    const currentTime = new Date();
    if (currentTime > pass.validUntil && pass.status === 'Valid') {
        pass.status = 'Expired';
        await pass.save();
    }


    res.status(200).json({
      success: true,
      data: pass,
    });
  } catch (error) {
    console.log("Error in verifyPass:", error);
    next(error);
  }
};


exports.getVisitorPasses = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    

    const visitor = await Visitor.findOne({ email: userEmail });
    if (!visitor) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }


    let passes = await Pass.find()
      .populate({
        path: 'appointment',
        match: { visitor: visitor._id },
        populate: { path: 'employee', select: 'name email phone' }
      })
      .sort('-createdAt');


    const myPasses = [];
    for (let i = 0; i < passes.length; i++) {
        if (passes[i].appointment !== null) {
            myPasses.push(passes[i]);
        }
    }


    res.status(200).json({
      success: true,
      count: myPasses.length,
      data: myPasses,
    });
  } catch (error) {
    console.log("Error in getVisitorPasses:", error);
    next(error);
  }
};
