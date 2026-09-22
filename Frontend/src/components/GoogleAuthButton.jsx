import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const GoogleAuthButton = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [googleToken, setGoogleToken] = useState('');
  const [dateofBirth, setDateofBirth] = useState(null);
  const [gender, setGender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Send request to backend
  const handleBackendGoogleAuth = async (idToken, extraData = {}) => {
    try {
      const res = await axios.post(`${API_URL}/auth/google`, {
        idToken,
        ...extraData,
      });

      // Status 202: User exists on Google, but DOB/Gender are required
      if (res.status === 202 && res.data.requiresProfileCompletion) {
        setGoogleToken(idToken);
        setShowModal(true);
        return;
      }

      // Status 200/201: Login or Signup complete
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
        setShowModal(false);
        navigate('/');
      }
    } catch (err) {
      if (err.response?.data?.errors && err.response.data.errors.length > 0) {
        setError(err.response.data.errors[0].msg);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Google authentication failed.');
      }
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    setError('');
    handleBackendGoogleAuth(credentialResponse.credential);
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was unsuccessful.');
  };

  const handleProfileCompletionSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!dateofBirth || !gender) {
      setError('Please select both Date of Birth and Gender.');
      return;
    }

    setIsSubmitting(true);
    await handleBackendGoogleAuth(googleToken, {
      dateofBirth,
      gender,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="w-full flex flex-col items-center my-3">
      {error && !showModal && (
        <div className="w-full mb-3 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Official Google Button Component */}
      <div className="w-full flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="outline"
          shape="pill"
          width="350px"
          text="continue_with"
        />
      </div>

      {/* Profile Completion Modal for Google Sign-Ups */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 text-center">One Last Step!</h2>
            <p className="mt-1 text-xs text-gray-500 text-center">
              Please provide your date of birth and gender to complete your registration.
            </p>

            {error && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-600 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleProfileCompletionSubmit} className="mt-4 flex flex-col gap-4">
              {/* DOB */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Date of Birth
                </label>
                <DatePicker
                  selected={dateofBirth}
                  onChange={(date) => setDateofBirth(date)}
                  dateFormat="MM/dd/yyyy"
                  maxDate={new Date()}
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={70}
                  placeholderText="Select date of birth"
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Gender
                </label>
                <div className="flex items-center space-x-4 mt-1">
                  <label className="inline-flex items-center text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="googleGender"
                      value="Male"
                      checked={gender === 'Male'}
                      onChange={(e) => setGender(e.target.value)}
                      className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      required
                    />
                    <span className="ml-1.5">Male</span>
                  </label>

                  <label className="inline-flex items-center text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="googleGender"
                      value="Female"
                      checked={gender === 'Female'}
                      onChange={(e) => setGender(e.target.value)}
                      className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="ml-1.5">Female</span>
                  </label>

                  <label className="inline-flex items-center text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="googleGender"
                      value="Others"
                      checked={gender === 'Others'}
                      onChange={(e) => setGender(e.target.value)}
                      className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="ml-1.5">Others</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2 px-3 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2 px-3 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthButton;