import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import ReactDOM from 'react-dom';
import App from './App';
import { Tabs } from "antd";
import OrdersList from './pages/orders';
import { ConfigProvider } from "antd";
import AppHeader from './pages/header';
import "./custom-app.css";
import "./index.css";
import WysigEditor from './pages/ReportEditor/wysig';
import Login from './pages/login';
import { ErrorBoundary } from "react-error-boundary";
import MyWorklist from './pages/my-workilist';
import PacsList from './pages/pacs';
import { createTabChannel, getUserDetails } from './utils/helper';
import dayjs from 'dayjs';
import Settings from './pages/settings';
import DispatchList from './pages/Dispatch';
import ReportingPage from './pages/ReportEditor/reporting-page'; ``

const MyViewer = ({ appProps }) => {

  useEffect(() => {
    const app = React.createElement(App, appProps, null);
    const pacs_app_element = document.getElementById('pacs-app');
    if (pacs_app_element) {
      ReactDOM.render(app, pacs_app_element);
    }
  }, []);

  return (<div id="!pacs-app">
    <ErrorBoundary fallback={<div>Something went wrong. Please refresh the browser tab</div>}>
      <App config={appProps.config} defaultExtensions={appProps.defaultExtensions} defaultModes={appProps.defaultModes} />
    </ErrorBoundary>
  </div>);
};

function CustomApp(appProps) {

  const userDetails = getUserDetails();
  const isTechnician = userDetails?.user_type === 'technician';
  const userType = userDetails?.user_type;

  const activeTabKeysMap = {
    dispatch: 'dispatch',
    technician: 'orders',
    radiologist: 'pacs',
    typist: 'pacs',
    admin: 'orders',
    consultant: 'consultant'
  }

  const [selectedTabKey, setSelectedTabKey] = React.useState(activeTabKeysMap[userType]);
  const currentUrl = window.location.href;
  const [appDateRange, setAppDateRange] = useState([null, null]);


  useEffect(() => {
  }, [currentUrl]);

  const ordersPage = {
    key: 'orders',
    label: 'Orders',
    children: <OrdersList />,
  };

  const workListTab = {
    key: 'worklist',
    label: 'My Worklist',
    children: <>
      <MyWorklist />
    </>,
  };

  const pacsTab = {
    key: 'pacs',
    label: 'PACS',
    children: <>
      <PacsList />
    </>,
  };

  const dispatchTab = {
    key: 'dispatch',
    label: 'Dispatch',
    children: <>
      <DispatchList isConsultant={false} />
    </>,
  };

  const consultantTab = {
    key: 'consultant',
    label: 'Consultant',
    children: <>
      <DispatchList isConsultant={true} />
    </>,
  };


  const viewerTab = {
    key: 'viewer_pacs',
    label: 'Viewer',
    children: <MyViewer appProps={appProps} />,
    disabled: true,
  };

  let items: TabsProps['items'] = userType === 'technician' ? [
    ordersPage
  ] : userType === 'dispatch' ? [
    dispatchTab
  ] : [
    workListTab,
    pacsTab,
  ];

  switch (userType) {
    case 'technician':
      items = [ordersPage, pacsTab]
      break;
    case 'admin':
      items = [ordersPage]
      break;
    case 'dipatch':
      items = [dispatchTab]
      break;
    case 'radiologist':
      items = [
        workListTab, pacsTab
      ]
      break;
    case 'typist':
      items = [
        workListTab, pacsTab
      ]
      break;
    case 'consultant':
      items = [
        consultantTab
      ]
      break;
    default:
      break;
  }

  const ViewerElement = () => {
    useEffect(() => {
      const channel = createTabChannel();

      channel.listenForUpdates((newUrl) => {
        window.location.href = newUrl;
      });

      return () => channel.cleanup();
    }, []);

    return (
      <MyViewer appProps={appProps} />
    );
  };

  const RestrictedAccess = () => {
    return (
      <div>
        <div className="restricted-access">
          Restricted Page or Page Not Found
        </div>
        <div className="restrict-desc">
          The url you are trying to access is either restricted or does not
          exist.
        </div>
      </div>
    );
  };

  const PrivateRoute = ({ children, accessType }) => {
    // let location = useLocation();
    const token = sessionStorage.getItem("access_token");
    const userDetails = getUserDetails();
    const userType = userDetails.user_type;
    if (accessType) {
      if (userType === accessType) {
        return children;
      } else {
        return <RestrictedAccess />
      }
    }
    return children;
  };

  const AppView = ({ appDateRange }) => {
    return (
      <BrowserRouter>
        <div className="app-content" style={{ background: "white", height: '100vh' }}>
          <Routes>
            <Route path='/' element={
              <>
                <Tabs onTabClick={(activeKey) => {
                  if (selectedTabKey !== activeKey) {
                    setSelectedTabKey(activeKey);
                    // if (activeKey !== 'viewer_pacs') {
                    //   window.location.href = '/';
                    // }
                  }
                }} activeKey={selectedTabKey} style={{ background: 'white' }} items={items} />

              </>
            }
            />
            <Route
              path="/login"
              element={
                <>
                  <Login />
                </>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute accessType={'admin'}>
                  <>
                    <Settings />
                  </>
                </PrivateRoute>
              }
            />
            <Route
              path="/report"
              element={
                <>
                  <ReportingPage />
                </>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    )
  };

  const handleDateChange = (val) => {
    setAppDateRange([dayjs().add(-val, 'd'), dayjs()]);
    // [dayjs().add(-7, 'd'), dayjs()]
  }

  return (
    <>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#EF8200",
          },
        }}
      >
        {currentUrl.includes('/viewer') ? null : <AppHeader handleDateChange={handleDateChange} />}
        <div className={currentUrl.includes('/viewer') ? 'viewer-body' : 'custom-body'}>
          {
            currentUrl.includes('/viewer') ?
              <ViewerElement /> :
              <AppView appDateRange={appDateRange} />
          }
        </div>
      </ConfigProvider>
    </>
  );
};

export default CustomApp;
