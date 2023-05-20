/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// This is your test publishable API key.
const stripe = Stripe(
  'pk_test_51N9NTTISr26WeZMuyexznkr7v0Uy02LKk0huuxveC5Kitnhhx4rfBFTbPfDbaClnS1SZVTb0L1hJOVAJlInSIidp00nwXj8p9P'
);

export const bookTour = async function(tourId) {
  try {
    // 1) get checkout session từ API
    const result = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // 2) tạo checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: result.data.session.id
    });
  } catch (error) {
    console.error(error);
    showAlert('error', error);
  }
};
