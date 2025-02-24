import axiosInstance, { BASE_API } from "../axios";
const moment = require("moment");

export const RADIOLOGY_URL = (pin, location) => `https://smj-pacs-int.yashodahospital.com/RadiologyDesk/PatientDetails_Tab.aspx?Pin=${pin}&LOC=${location}`
export const ConvertStringToDate = (dateString, timeString) => {
  if (!dateString || !timeString) return "";
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6) - 1; // Month is zero-based in JavaScript Date objects
  const day = dateString.substring(6, 8);

  // Extract hour, minute, and second from the time string
  const hour = timeString.substring(0, 2);
  const minute = timeString.substring(2, 4);
  const second = timeString.substring(4, 6);

  // Create a Date object
  const combinedDate = new Date(year, month, day, hour, minute, second);
  return combinedDate;
}

export const setUserDetails = (userDetails) => {
  localStorage.setItem("user_details", JSON.stringify(userDetails));
}

export const getUserDetails = () => {
  return JSON.parse(localStorage.getItem("user_details"));
}

export const setAccessToken = (accessToken) => {
  localStorage.setItem("access_token", accessToken);
}

export const getAccessToken = () => {
  return localStorage.getItem("access_token");
}

export const makePostCall = (url, payload, headers) => {
  return axiosInstance.post(BASE_API + url, payload, headers);
}

export const makeGetCall = (url) => {
  return axiosInstance.get(BASE_API + url);
}


export const hisStatusOptions = [
  { label: 'UNCONFIRMED', value: 'UNCONFIRMED' },
  { label: 'CONFIRMATION_IN_PROGRESS', value: 'CONFIRMATION_IN_PROGRESS' },
  { label: 'WAIT_FOR_MANUAL_CONFIRMATION', value: 'WAIT_FOR_MANUAL_CONFIRMATION' },
  { label: 'CONFIRMED', value: 'CONFIRMED' },
  { label: 'DUPLICATE_ACCESSION_NO', value: 'DUPLICATE_ACCESSION_NO' },
  { label: 'CONFIRMATION_NOT_REQUIRED', value: 'CONFIRMATION_NOT_REQUIRED' },
]

export function calculateExactAge(dobString) {
  // Parse the DOB in YYYYMMDD format
  const dob = moment(dobString, "YYYYMMDD");

  // If the DOB is invalid, return an error message
  if (!dob.isValid()) {
    return "Invalid DOB format";
  }

  // Check if the date is in the future
  if (dob.isAfter(moment())) {
    return "Invalid DOB: Future date provided.";
  }

  // Calculate difference in years, months, and days
  const now = moment();
  const years = Math.floor(moment.duration(now.diff(dob)).asYears());
  const months = Math.floor(moment.duration(now.diff(dob)).asMonths() % 12);
  const days = Math.floor(moment.duration(now.diff(dob)).asDays() % 30.44);

  // Determine the most appropriate unit to display
  if (years > 0) {
    return `${years} ${years === 1 ? "year" : "years"}`;
  } else if (months > 0) {
    return `${months} ${months === 1 ? "month" : "months"}`;
  } else {
    return `${days} ${days === 1 ? "day" : "days"}`;
  }
}

export const removeContentById = (html, idToRemove) => {
  // Create a temporary DOM element
  const temp = document.createElement('div');
  temp.innerHTML = html;
  // Find and remove the element with the specified ID
  const elementToRemove = temp.querySelector(`#${idToRemove}`);
  if (elementToRemove) {
    elementToRemove.remove();
  }

  // Return the modified HTML string
  return temp.innerHTML;
};


export const hasReportingPermission = (userDetails) => {
  const userType = userDetails?.user_type;
  if (userType === 'radiologist' || userType === 'typist' || userType === 'hod') {
    // additionally check explicitly if the user has the particular permission
    return true;
  }
  return false;
}

export const hasStudyViewingPermission = (userDetails) => {
  const userType = userDetails?.user_type;
  if (userType === 'radiologist' || userType === 'hod' || userType === 'technician') {
    // additionally check explicitly if the user has the particular permission
    return true;
  }
  return false;
}

export const hasUploadNotesPermission = (userDetails) => {
  const userType = userDetails?.user_type;
  if (userType === 'technician') {
    // additionally check explicitly if the user has the particular permission
    return true;
  }
  return false;
}

export const createTabChannel = (channelName = 'tab_communication') => {
  const channel = new BroadcastChannel(channelName);

  return {
    // Send URL update to other tabs
    sendUrlUpdate: (newUrl) => {
      channel.postMessage({ type: 'URL_UPDATE', url: newUrl });
    },

    // Listen for URL updates in the other tab
    listenForUpdates: (callback) => {
      channel.onmessage = (event) => {
        if (event.data.type === 'URL_UPDATE') {
          callback(event.data.url);
        }
      };
    },

    // Clean up when no longer needed
    cleanup: () => {
      channel.close();
    }
  };
};
