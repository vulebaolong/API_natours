const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');

const router = express.Router();

router
  .route('/topTours')
  // tourController.aliasTopTour đây là middle ở giữa để thiết lập các option cho đường dẫn
  // tourController.aliasTopTour có chạy hàm next() để chạy tiếp tục tourController.getAllTours
  .get(tourController.aliasTopTour, tourController.getAllTours);

// router.param('id', tourController.checkID);
router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);

router.route('/tours-start').get(tourController.getToursStart);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
