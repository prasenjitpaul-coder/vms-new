const Appointment = require('../models/Appointment.model');


exports.getAppointments = async (req, res, next) => {
  try {
    console.log("Getting appointments for user role:", req.user.role);

    let queryArgs = {};


    if (req.user.role === 'Employee') {
      queryArgs.employee = req.user.id;
    }


    if (req.query.status) {
      queryArgs.status = req.query.status;
    }


    const appointments = await Appointment.find(queryArgs)
      .populate('visitor')
      .populate('employee', 'name email');


    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.log("Error in getAppointments:", error);
    next(error);
  }
};


exports.getAppointment = async (req, res, next) => {
  try {
    const id = req.params.id;
    

    const appointment = await Appointment.findById(id)
      .populate('visitor')
      .populate('employee', 'name email');


    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (req.user.role === 'Employee') {
      if (appointment.employee._id.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: 'You are not authorized to view this appointment' });
      }
    }


    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.log("Error in getAppointment:", error);
    next(error);
  }
};


exports.createAppointment = async (req, res, next) => {
  try {
    console.log("Creating new appointment");

    const appointmentData = req.body;
    

    if (!appointmentData.employee) {
      appointmentData.employee = req.user.id;
    }


    const newAppointment = await Appointment.create(appointmentData);

    res.status(201).json({
      success: true,
      data: newAppointment
    });
  } catch (error) {
    console.log("Error in createAppointment:", error);
    next(error);
  }
};


exports.updateAppointment = async (req, res, next) => {
  try {
    const id = req.params.id;
    console.log(`Updating appointment ${id}`);
    

    let appointment = await Appointment.findById(id);


    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }


    if (req.user.role === 'Employee') {
      if (appointment.employee.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: 'You are not authorized to update this appointment' });
      }
    }

    appointment = await Appointment.findByIdAndUpdate(id, req.body, {
      new: true, 
      runValidators: true 
    });


    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.log("Error in updateAppointment:", error);
    next(error);
  }
};


exports.deleteAppointment = async (req, res, next) => {
  try {
    const id = req.params.id;
    console.log(`Deleting appointment ${id}`);
    

    const appointment = await Appointment.findById(id);


    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
  
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Only Admins can delete appointments' });
    }


    await Appointment.findByIdAndDelete(id);


    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully',
      data: {}
    });
  } catch (error) {
    console.log("Error in deleteAppointment:", error);
    next(error);
  }
};
