function handleNetworkError(error) {
  console.error('Network Error:', error);
  alert('A network error occurred. Please check your internet connection and try again.');
}

function handleAPIError(error) {
  console.error('API Error:', error);
  if (error.response) {
    console.error('Error Status:', error.response.status);
    console.error('Error Data:', error.response.data);
    alert('An error occurred while communicating with the server. Please try again later.');
  } else if (error.request) {
    console.error('No response received from the server.');
    alert('No response received from the server. Please check your internet connection and try again.');
  } else {
    console.error('Error:', error.message);
    alert('An error occurred while setting up the request. Please try again.');
  }
}

function handleValidationError(message) {
  console.error('Validation Error:', message);
  alert(message);
}

function handleError(error) {
  console.error('Error:', error);
  alert('An unexpected error occurred. Please try again.');
}

function validateFormInputs(apiKey, context) {
  if (apiKey.trim() === '') {
    handleValidationError('Please provide the API key.');
    return false;
  }

  if (context.trim() === '') {
    handleValidationError('Please provide the context.');
    return false;
  }

  return true;
}
