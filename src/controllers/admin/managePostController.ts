import { Request, Response } from "express";
import { Villa } from "../../models/villaModel";

const manageVillaController = {
  updateVillaStatus: async (req: Request, res: Response) => {
    try {
      if (!req.body.status) {
        return res.status(400).json({
          status: "error",
          message: "Status field is required to update",
        });
      }

      const updatedVilla = await Villa.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true },
      );

      if (!updatedVilla) {
        return res.status(404).json({
          status: "error",
          message: "Villa not found",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Villa status updated successfully",
        data: updatedVilla,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },
};

module.exports = manageVillaController;
