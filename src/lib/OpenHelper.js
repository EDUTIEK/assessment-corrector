import Cookies from 'js-cookie';

/**
 * Handle the opening of the app
 * @returns {boolean} true if a redirect was triggered and the app must not be initialized
 */
export function handleOpen() {

  // save the cookie parameters
  setParam('userId',  Cookies.get('xlasUserId'));
  setParam('userToken',  Cookies.get('xlasUserToken'));
  setParam('asAdmin',  Cookies.get('xlasAsAdmin'));
  setParam('backendUrl',  Cookies.get('xlasBackendUrl'));
  setParam('returnUrl',  Cookies.get('xlasReturnUrl'));

  Cookies.remove('xlasUserId');
  Cookies.remove('xlasUserToken');
  Cookies.remove('xlasAsAdmin');
  Cookies.remove('xlasBackendUrl');
  Cookies.remove('xlasReturnUrl');

  // save the query parameters and do a reload to get a clean url
  if (window.location.search) {
    setParam('query', window.location.search.substring(1));
    const url = new URL(window.location.href);
    url.search = '';
    window.location.replace(url.href);
    return true;
  }
  return false;
}

function setParam(key, value) {
  if (value !== undefined && value !== null) {
    sessionStorage.setItem('xlas_corrector_' + key, value);
  }
}