import { Button, Input, Modal, Select, Table, Space, DatePicker, message, Tabs, Upload, Row, Col, Spin, Form } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { orderColumns } from './constants';
import ReportEditor from '../ReportEditor';
import "./pacs.css";
import FloatLabel from '../../components/FloatingLabel';
import axiosInstance, { BASE_API, BASE_URL } from '../../axios';
import { getAccessToken, getUserDetails, hasReportingPermission, hasStudyViewingPermission, hisStatusOptions, makePostCall } from '../../utils/helper';
import { SavedSearches } from '../orders/constants';

import dayjs from 'dayjs';
import FyzksInput from '../../components/FyzksInput';
import { debounce } from 'lodash';
import TabPane from 'antd/es/tabs/TabPane';
import TextArea from 'antd/es/input/TextArea';
import ViewNotes from '../ManageNodes/ViewNotes';
import { useForm } from 'antd/es/form/Form';


const { RangePicker } = DatePicker;

const PacsList = () => {
  const [orders, setOrders] = useState({ data: [], loading: true });
  const [reportEditorModal, setReportEditorModal] = useState({ visible: false, data: {} });
  const [saveFiltersModal, setSaveFiltersModal] = useState({ visible: false, data: {} });
  const [assignModal, setAssignModal] = useState({ visible: false, data: {} });
  const [selectedUsersToAssign, setSelectedUsersToAssign] = useState([]);
  const [userList, setUserList] = useState([]);
  const [addFileModal, setAddFileModal] = useState({ visible: false, notes: null, modalType: 'upload', file: null, fileType: null });
  const [viewNotesModal, setViewNotesModal] = useState({ visible: false, details: null });
  const [receiverModal, setReceiverModal] = useState({ visible: false, details: null });
  const [selectedNote, setSelectedNote] = useState({});

  const [filterName, setFilterName] = useState(null);
  const [filters, setFilters] = useState({});
  const [savedFilters, setSavedFilters] = useState([]);
  const userDetails = getUserDetails();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [refreshDisabled, setRefreshDisabled] = useState(false)
  const [current, setCurrent] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [printLoading, setPrintLoading] = React.useState(false);

  const [receiverForm] = useForm();

  const today = dayjs();
  const yesterday = dayjs().subtract(1, 'days');

  // Set the default value to [yesterday, today]
  const [dateRange, setDateRange] = useState([yesterday, today]);

  const isHOD = userDetails?.user_type === 'hod';

  const userType = userDetails?.user_type;

  useEffect(() => {
    console.log("INSIDE ON INIT");

    // getPacsList();
    getSavedFilters();
    getUsersList();
  }, []);

  useEffect(() => {
    console.log("Filters changed", filters);
    // if (Object.keys(filters).length) {
    debouncedFilter(filters);
    // }
  }, [filters]);

  useEffect(() => {
    console.log("date changed", filters);
    // if (Object.keys(filters).length) {
    debouncedFilter(filters);
    // }
  }, [dateRange]);

  // const debouncedFilter = debounce(() => { filterResults() }, 300);

  const debouncedFilter = useCallback(
    debounce((tempFilters) => {
      console.log('Debounced value:');
      filterResults(tempFilters);
    }, 500),
    [dateRange]
  );

  const getUsersList = () => {
    makePostCall('/user-list', {}).then(res => {
      setUserList(res.data?.data || []);
    })
      .catch(e => {
        console.log(e);
        setUserList([]);
      })
  }

  const onSave = (newContent, status, currentReport, moreInfo, callback) => {
    const { pacs_order } = reportEditorModal?.data;
    const { patient } = pacs_order;
    const { proxy_user, correlated, diagnosed, co_signing_doctor } = moreInfo;

    makePostCall('/submit-report', {
      html: newContent,
      yh_no: patient.pat_pin,
      order_no: pacs_order?.po_his_ord_no,
      acc_no: pacs_order?.po_acc_no,
      order_id: pacs_order?.pacs_ord_id,
      user_id: getUserDetails()?.username,
      ...moreInfo,
      proxy_user: proxy_user,
      co_signing_doctor: co_signing_doctor,
      status,
      report_id: currentReport?.pr_id,
      correlated: correlated,
      diagnosed: diagnosed,
    })
      .then(res => {
        callback && callback();
        setReportEditorModal({ visible: false, data: null })
      })
      .catch(e => {
        console.log(e);
      });
  }


  const getPacsList = async () => {
    makePostCall('/pacs-list', {
      role: userDetails?.user_type,
    })
      .then(res => {
        setOrders({ data: res.data?.data || [], loading: false })
      })
      .catch(e => {
        console.log(e);
        setOrders({ data: [], loading: false })
      });
  }

  const cancelReport = () => {
    setReportEditorModal({ visible: false, data: {} });
  }

  const openViewer = (record) => {
    if (hasStudyViewingPermission(userDetails)) {
      window.open(`/viewer?StudyInstanceUIDs=${record?.ps_study_uid}`, '_blank')
    } else {
      message.info("You do not habe the permission to view the study images")
    }
  }

  const openReport = async (record) => {
    if (hasReportingPermission(userDetails)) {
      const data = {
        order_ids: [record?.pacs_order?.pacs_ord_id].join(','),
      };
      // Convert data to URL parameters
      const params = new URLSearchParams(data).toString();
      // Open in new tab
      window.open(`/report?${params}`, '_blank');

      // const response = await makePostCall('/study-report-details', { user_id: getUserDetails()?.username, order_id: record?.pacs_order?.pacs_ord_id });
      // if (response?.data?.success) {
      //   setReportEditorModal({ visible: true, data: record });
      // } else {
      //   message.error(response?.data?.message);
      //   return;
      // }
    } else {
      message.info("You do not have the permission to do reporting")
    }
  }

  const openSelectedStudies = () => {
    if (hasReportingPermission(userDetails)) {
      const data = {
        order_ids: selectedRowKeys.join(','),
      };
      // Convert data to URL parameters
      const params = new URLSearchParams(data).toString();
      // Open in new tab
      window.open(`/report?${params}`, '_blank');
    } else {
      message.info("You do not have the permission to do reporting")
    }
  }

  const getSavedFilters = async () => {
    makePostCall('/get-saved-filters', { user_id: getUserDetails()?.username })
      .then(res => {
        setSavedFilters(res.data?.data || []);
      })
      .catch(e => {
        console.log(e);
        setSavedFilters([]);
      });
  }

  const submitSaveFilters = () => {
    setSaveFiltersModal({ saveLoading: true })
    const payload = {
      filters: JSON.stringify(filters),
      uf_filter_name: filterName,
      user_id: getUserDetails()?.username
    };
    makePostCall('/save-my-filters', payload)
      .then(res => {
        getSavedFilters();
        setSaveFiltersModal({ visible: false })
      })
      .catch(e => {
        console.log(e);
        message.error(e);
      });
  }

  const clearFilters = () => {
    setFilters({});
    setDateRange(null);
    getPacsList();
  }

  const filterResults = (tempFilters) => {
    setOrders({ loading: true, data: [] });
    const payload = { ...tempFilters };

    if (dateRange) {
      payload['from_date'] = dayjs(dateRange[0]).format('YYYYMMDD');
      payload['to_date'] = dayjs(dateRange[1]).format('YYYYMMDD');
      payload['po_study_date'] = dateRange;
    }
    console.log("final payload", payload, tempFilters);

    makePostCall('/pacs-list', payload)
      .then(res => {
        setOrders({ data: res.data?.data || [], loading: false })
      })
      .catch(e => {
        console.log(e);
        setOrders({ data: [], loading: false })
      });
  }

  const handleFilterChange = (key, value) => {
    const temp_filters = { ...filters };
    temp_filters[key] = value;
    setFilters(temp_filters);
  }

  const refreshScanStatus = () => {
    setRefreshDisabled(true); // Disable the button
    setTimeout(() => {
      setRefreshDisabled(false); // Re-enable the button after 5 seconds
    }, 2);

    axiosInstance.get(BASE_API + '/update-status')
      .then(res => {
        filterResults(filters);
      })
      .catch(e => {
        console.log(e);
      })
  }

  // const debouncedRefresh = useCallback(
  //   debounce(() => {
  //     console.log('Debounced value:');
  //     refreshScanStatus();
  //   }, 2),
  //   []
  // );

  const statusOptions = userDetails?.user_type === 'doc' ? [
    { label: 'REVIEWED', value: 'REVIEWED' },
    { label: 'SIGNEDOFF', value: 'SIGNEDOFF' },
  ] :
    [
      // { label: 'PENDING', value: 'PENDING' },
      { label: 'SCANNED', value: 'SCANNED' },
      { label: 'DRAFTED', value: 'DRAFTED' },
      { label: 'SIGNEDOFF', value: 'SIGNEDOFF' },
    ]

  const bodyPartOptions = [
    { label: 'Head', value: 'HEAD' },
    { label: 'Brain', value: 'BRAIN' },
    { label: 'Abdomen', value: 'ABDOMEN' },
    { label: 'Chest', value: 'CHEST' },
    { label: 'Leg', value: 'LEG' },
    { label: 'Hand', value: 'HAND' },
  ];

  const siteOptions = [
    { label: 'Somajiguda', value: 'SOMAJIGUDA' },
    { label: 'HiTech City', value: 'HITEC CITY' },
    { label: 'Secunderabad', value: 'SECUNDERABAD' },
  ];

  const modalityOptions = [
    { label: 'CT', value: 'CT' },
    { label: 'Ultra Sound', value: 'US' },
    { label: 'MRI', value: 'MRI' },
    { label: 'DX', value: 'DX' },
  ];

  const handleFilterSelection = (selectedSavedFilter) => {
    const filterString = selectedSavedFilter.uf_filter_json;
    const filterJson = JSON.parse(filterString);

    setFilters(filterJson);
  }

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    // getCheckboxProps: (record: DataType) => ({
    //   disabled: !isHOD, // Column configuration not to be checked
    // }),
  };

  const assignToUser = () => {
    setAssignModal({ visible: false, data: {} });
    // send request to assign users to the selected report
    makePostCall('/assign-to-user', { order_ids: selectedRowKeys, assigned_to: selectedUsersToAssign })
      .then(res => {
        // refresh the report data
        filterResults(filters);
      })
      .catch(e => {
        console.log(e);
      });
  }

  const addFile = (rec) => {
    setAddFileModal({ visible: true, data: rec, modalType: 'upload' });
  }

  const uploadRisNotes = async () => {
    const { data, modalType, fileType, notes, file, isNotes } = addFileModal;

    const { pacs_order } = data;
    const { patient } = pacs_order
    const formData = new FormData();


    formData.append('order_id', pacs_order?.pacs_ord_id);
    formData.append('pin', pacs_order?.patient?.pat_pin);

    let headers = {
      'Content-Type': 'multipart/form-data'
    };
    if (isNotes) {
      formData.append('type', 'notes');
      formData.append('notes', notes);
    } else {
      formData.append('file_type', fileType);
      formData.append('file', file);
    }

    const url = isNotes ? '/upload-notes' : '/upload-file';

    try {
      makePostCall(url, formData, {
        headers,
      }).then((res) => {
        console.log("response", res);
        setAddFileModal(null);
      }).catch((error) => {
        message.error('Failed to upload file');
      })
    } catch (error) {
      message.error('Failed to upload file');
    }
  };

  const captureReceiver = (rec) => {
    setReceiverModal({ visible: true, details: rec });
  }

  const captureAndPrint = () => {
    const receiverInfo = receiverForm.getFieldsValue();
    printReport(receiverModal?.details, receiverInfo);
  }

  const printReport = (rec) => {
    setPrintLoading(true);
    const { pacs_order } = rec;
    makePostCall('/print-acc-report', {
      order_id: pacs_order.pacs_ord_id,
      user_id: getUserDetails()?.username,
    }, {
      responseType: "arraybuffer",
    })
      .then(res => {
        const pdfBlob = new Blob([res.data], { type: "application/pdf" });
        const pdf_url = URL.createObjectURL(pdfBlob);
        // setPdfUrl(url);
        const printWindow = window.open(pdf_url, "_blank");
        printWindow.print();
      })
      .catch(err => {
        console.log("Error", err);
      })
      .finally(() => {
        setPrintLoading(false);
      })
  }

  const viewNotes = (rec) => {
    const firstNote = rec.pacs_order?.ris_notes[0] || {};
    setSelectedNote(firstNote)
    setViewNotesModal({ visible: true, details: rec })
  }

  const handleNoteSelection = (note, record) => {
    setSelectedNote(note);
  }

  const toggleReporting = (rec, idx) => {
    const { pacs_order } = rec;
    const { po_pacs_ord_id } = pacs_order;
    const shouldBlock = po_block_reporting !== 'Y';
    const currentIndx = (current - 1) * pageSize + idx;
    // toggle-reporting
    const payload = {
      user_id: getUserDetails()?.username,
      order_id: po_pacs_ord_id,
      shouldBlock,
    };
    makePostCall('/toggle-reporting', payload)
      .then(res => {
        message.success("Updated successfully");
        const prevOrders = orders?.data || [];
        prevOrders[currentIndx].po_block_reporting = shouldBlock ? 'Y' : 'N';
        setOrders({ data: prevOrders, loading: false })
      })
      .catch(e => {
        console.log("Error while blockig report", e);
        message.error(e.message)
      })
  }

  const toggleFeatures = (rec, idx, feature) => {
    const { pacs_order, order_workflow } = rec;
    const { pacs_ord_id, po_emergency, po_his_status } = pacs_order;
    const { ow_reporting_blocked } = order_workflow;

    const shouldConfirm = po_his_status !== 'CONFIRMED';
    const shouldBlock = ow_reporting_blocked !== 'Y';
    const markEmergency = po_emergency !== 'Y';

    const currentIndx = (current - 1) * pageSize + idx;


    // toggle-reporting
    const payload = {
      user_id: getUserDetails()?.username,
      order_id: pacs_ord_id,
      // shouldConfirm,
    };

    let url = '';
    let objProperty = '';
    let objValue = '';

    switch (feature) {
      case 'emergency':
        payload.markEmergency = markEmergency;
        url = '/toggle-emergency';
        objProperty = 'po_emergency';
        objValue = markEmergency ? "Y" : 'N';
        break;
      case 'confirmation':
        payload.shouldConfirm = shouldConfirm;
        url = '/toggle-confirmation';
        objProperty = 'po_his_status';
        objValue = shouldConfirm ? "CONFIRMED" : 'UNCONFIRMED';
        break;
      case 'reporting':
        payload.shouldBlock = shouldBlock;
        url = '/toggle-reporting';
        objProperty = 'po_block_reporting';
        objValue = shouldBlock ? "Y" : 'N';
        break;
      default:
        return;
    }


    makePostCall(url, payload)
      .then(res => {
        message.success("Updated successfully");
        const prevOrders = orders?.data || [];

        prevOrders[currentIndx][objProperty] = objValue;
        setOrders({ data: prevOrders, loading: false })
      })
      .catch(e => {
        console.log("Error while blockig report", e);
        message.error(e.message)
      })
  }

  const toggleConfirmation = (rec, idx) => {
    const { pacs_order } = rec;
    const { pacs_ord_id, po_his_status } = pacs_order;
    const shouldConfirm = po_his_status !== 'CONFIRMED';
    const currentIndx = (current - 1) * pageSize + idx;
    // toggle-reporting
    const payload = {
      user_id: getUserDetails()?.username,
      order_id: pacs_ord_id,
      shouldConfirm,
    };
    makePostCall('/toggle-confirmation', payload)
      .then(res => {
        message.success("Updated successfully");
        const prevOrders = orders?.data || [];
        prevOrders[currentIndx].po_his_status = shouldConfirm ? 'CONFIRMED' : 'UNCONFIRMED';
        setOrders({ data: prevOrders, loading: false })
      })
      .catch(e => {
        console.log("Error while blockig report", e);
        message.error(e.message)
      })
  }

  const assignToSelfTechnician = (rec, idx) => {
    // assign-to-tech
    const { po_ord_no, po_acc_no } = rec;
    const payload = {
      user_id: getUserDetails()?.username,
      ord_no: po_ord_no,
      acc_no: po_acc_no,
    };
    const currentIndx = (current - 1) * pageSize + idx;
    makePostCall('/assign-to-tech', payload)
      .then(res => {
        message.success("Updated successfully");
        const prevOrders = orders?.data || [];
        prevOrders[currentIndx].po_assigned_technician = getUserDetails()?.username;
        setOrders({ data: prevOrders, loading: false })
      })
      .catch(e => {
        console.log("Error while blockig report", e);
        message.error(e.message)
      })
  }

  const reportedByOptions = useMemo(() => {
    return userList?.map((user) => ({ label: user.user_fullname, value: user.username }))
  }, [userList])

  const handleEnter = () => {
    console.log("handle ter");
    // filterResults();
  }

  const closeReport = async (data) => {
    setReportEditorModal({ visible: false });
    const resp = await makePostCall("/close-report", { order_id: data?.pacs_order?.pacs_ord_id })
  }

  return (
    <Spin spinning={printLoading}>
      <div>
        <SavedSearches savedFilters={savedFilters || []} handleFilterSelection={handleFilterSelection} />
        <div className='filters-section'>
          {/* <Space.Compact> */}
          {/* <span style={{ width: 140 }} className='!ms-3'>Patient Name</span> */}
          <div className='d-flex flex-wrap'>
            <FloatLabel label="Patient Name" value={filters['pat_name']} className="me-3">
              <FyzksInput onEnter={handleEnter} value={filters['pat_name']} onChange={(e) => handleFilterChange('pat_name', e.target.value)} />
            </FloatLabel>

            <FloatLabel label="YH No" value={filters['po_pin']} className="me-3">
              <FyzksInput onEnter={handleEnter} value={filters['po_pin']} width={200} onChange={(e) => handleFilterChange('po_pin', e.target.value)} />
            </FloatLabel>
            <FloatLabel label="Acc. No" value={filters['po_acc_no']} className="me-3">
              <FyzksInput onEnter={handleEnter} value={filters['po_acc_no']} width={200} onChange={(e) => handleFilterChange('po_acc_no', e.target.value)} />
            </FloatLabel>
            <FloatLabel label="Ref Doc." value={filters['po_ref_doc']} className="me-3">
              <Select value={filters['po_ref_doc']} allowClear style={{ width: 200 }} options={statusOptions} onChange={(val) => handleFilterChange('po_ref_doc', val)} />
            </FloatLabel>
            <FloatLabel label="Body Part / Study Desc" value={filters['po_body_part']} className="me-3">
              <FyzksInput onEnter={handleEnter} value={filters['po_body_part']} width={200} onChange={(e) => handleFilterChange('po_body_part', e.target.value)} />
            </FloatLabel>
            <FloatLabel label="HIS Status" value={filters['po_his_status']} className="me-3">
              <Select value={filters['po_his_status']} allowClear style={{ width: 200 }} options={hisStatusOptions} onChange={(val) => handleFilterChange('po_his_status', val)} />
            </FloatLabel>

            <FloatLabel label="Order No" value={filters['po_ord_no']} className="me-3">
              <FyzksInput onEnter={handleEnter} value={filters['po_ord_no']} width={200} onChange={(e) => handleFilterChange('po_ord_no', e.target.value)} />
            </FloatLabel>
            <FloatLabel label="Status" value={filters['po_status']} className="me-3">
              <Select value={filters['po_status']} allowClear style={{ width: 200 }} options={statusOptions} onChange={(val) => handleFilterChange('po_status', val)} />
            </FloatLabel>
            <FloatLabel label="Site" value={filters['po_site']} className="me-3">
              <Select value={filters['po_site']} allowClear style={{ width: 200 }} options={siteOptions} onChange={(val) => handleFilterChange('po_site', val)} />
            </FloatLabel>
            <FloatLabel label="Modality" value={filters['modality']} className="me-3">
              <Select allowClear value={filters['modality']} style={{ width: 200 }} options={modalityOptions} onChange={(val) => handleFilterChange('modality', val)} />
            </FloatLabel>
            <FloatLabel label="Reported By" value={filters['po_reported_by']} className="me-3">
              <Select
                showSearch
                value={filters['po_reported_by']}
                style={{ width: 200 }}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={reportedByOptions}
                onChange={(val) => handleFilterChange('po_reported_by', val)}
              />
            </FloatLabel>
            <FloatLabel label="Assigned to" value={filters['po_assigned_to']} className="me-3">
              <Select
                showSearch
                value={filters['po_assigned_to']}
                style={{ width: 200 }}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={reportedByOptions}
                onChange={(val) => handleFilterChange('po_assigned_to', val)}
              />
            </FloatLabel>
            <FloatLabel label="Study Date" value={filters['study_date']} className="me-3">
              <RangePicker size="middle" value={dateRange} onChange={(val) => {
                if (val) {
                  setDateRange([val[0], val[1]]);
                } else {
                  setDateRange(null);
                }
              }} />
            </FloatLabel>
          </div>
          <div>
            <Button className='ms-3 mb-2' type='primary' onClick={() => { filterResults(filters) }}>Search</Button>
            {isHOD && (
              <Button className='ms-3 mb-2' type='secondary' onClick={() => { setAssignModal({ visible: true }) }}>Assign</Button>
            )}
            {!isHOD && (
              <Button className='ms-3 mb-2' type='default' onClick={() => openSelectedStudies()}>Open Studies</Button>
            )}
            <Button className='ms-3' type='primary' onClick={() => { setSaveFiltersModal({ visible: true }) }}>Save Filters</Button>
            <Button className='ms-3' type='default' onClick={() => { clearFilters() }}>Clear Filters</Button>

          </div>
        </div>
        <div className='orders-list'>
          <Table
            tableLayout="fixed"
            rowSelection={rowSelection}
            loading={orders.loading}
            columns={orderColumns(
              {
                openViewer: openViewer, openReportEditor: openReport, role: userDetails?.user_type,
                assignToSelfTechnician, toggleReporting, addFile, viewNotes, printReport, toggleConfirmation, toggleFeatures
              }
            )}
            pagination={{
              current: current,
              pageSize: 10,
              total: orders?.data?.length || 0,
              showSizeChanger: false,
              pageSizeOptions: ['10', '15', '20'],
              onChange: (page, pageSize) => {
                setCurrent(page);
              },
              showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} items`,
              position: ['topRight']
            }}
            rowKey={(rec) => rec.pacs_order?.pacs_ord_id}
            dataSource={orders.data || []}
            onRow={(record, rowIndex) => {
              return {
              }
            }}
            style={{ width: '100%' }}
            scroll={{
              x: 1200
            }}
          />
          {reportEditorModal.visible && (
            <Modal
              className='report-modal' width={'100%'}
              onCancel={() => { closeReport(reportEditorModal?.data) }}
              footer={null} open={reportEditorModal.visible}
              style={{ top: 20 }} // Adjust position
              styles={{ body: { height: "90vh", overflowY: "auto" } }}
              keyboard={false}
            >
              <ReportEditor cancel={cancelReport} onSave={onSave} patientDetails={reportEditorModal.data} />
            </Modal>
          )}

          {saveFiltersModal.visible && (
            <Modal className='save-filter-modal' onCancel={() => { setSaveFiltersModal({ visible: false }) }}
              okButtonProps={{ disabled: !filterName || saveFiltersModal.saveLoading }} onOk={submitSaveFilters}
              open={saveFiltersModal.visible}
            >
              <Input width={300} onChange={(e) => setFilterName(e.target.value)} />
            </Modal>
          )}

          {assignModal.visible && (
            <Modal className='save-filter-modal' onCancel={() => { setAssignModal({ visible: false }) }}
              okButtonProps={{ disabled: !selectedUsersToAssign }} onOk={assignToUser}
              open={assignModal.visible}
            >
              Select User
              <div>
                <Select
                  showSearch
                  style={{ width: 200 }}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={userList?.map((user) => ({ label: user.user_fullname, value: user.username }))}
                  onChange={(val) => { setSelectedUsersToAssign(val) }}
                />
              </div>
            </Modal>
          )}

          {
            addFileModal && addFileModal?.visible && (
              <Modal
                open={addFileModal?.visible}
                onOk={() => { uploadRisNotes() }}
                onCancel={() => { setAddFileModal({}) }}
                okButtonProps={{
                  disabled: (addFileModal?.modalType === 'upload' && !addFileModal?.file) || (addFileModal?.modalType === 'notes' && !addFileModal?.notes),
                }}
              >
                <Tabs
                  activeKey={addFileModal.modalType}
                  onTabClick={(activeKey) => {
                    if (addFileModal.modalType !== activeKey) {
                      setAddFileModal({ ...addFileModal, modalType: activeKey, isNotes: activeKey === 'notes' });
                    }
                  }}
                >
                  <TabPane key='notes' tab="Notes">
                    <span>Enter Notes / Remarks</span>
                    <TextArea onChange={(e) => {
                      setAddFileModal({ ...addFileModal, notes: e.target.value })
                    }} />
                  </TabPane>
                  <TabPane key='upload' tab="Upload">
                    <Select
                      placeholder="File Type"
                      options={[
                        { label: 'Prescription', value: 'prescription' },
                        { label: 'Consent', value: 'consent' },
                      ]}
                      style={{ width: 200 }}
                      onSelect={(val) => { setAddFileModal({ ...addFileModal, fileType: val }) }}
                    />
                    <Upload customRequest={({ file }) => { setAddFileModal({ ...addFileModal, file }) }} accept="application/pdf" multiple={false} disabled={!addFileModal.fileType} >
                      <Button disabled={!addFileModal?.fileType}>Select File</Button>
                    </Upload>
                  </TabPane>
                </Tabs>
              </Modal>
            )}

          {
            viewNotesModal && viewNotesModal.visible && (
              <Modal
                open={viewNotesModal.visible}
                onCancel={() => { setViewNotesModal(null) }}
                onOk={() => { setViewNotesModal(null) }}
                style={{ width: '100%', height: '100%' }}
                width={'90%'}
              >
                <ViewNotes handleNoteSelection={handleNoteSelection} selectedNote={selectedNote} viewNotesModal={viewNotesModal} />
              </Modal>
            )
          }
          {
            receiverModal && receiverModal.visible && (
              <Modal
                open={receiverModal.visible}
                onCancel={() => { setReceiverModal(null) }}
                onOk={() => { setReceiverModal(null) }}
                style={{ width: '100%', height: '100%' }}
                width={'90%'}
                okButtonProps={{ style: { display: 'none' } }}
              >
                <Form form={receiverForm} onFinish={() => { captureAndPrint() }}>
                  <Form.Item name="receiver_name" label="Receiver Name">
                    <Input />
                  </Form.Item>
                  <Form.Item name="receiver_mobile" label="Receiver Mobile" rules={[
                    {
                      pattern: /^[6-9]\d{9}$/,
                      message: "Please enter a valid 10-digit mobile number!",
                    },
                  ]}>
                    <Input />
                  </Form.Item>
                  <Form.Item>
                    <Button htmlType='submit'>Submit</Button>
                    <Button type='link'>Continue without Info</Button>
                  </Form.Item>
                </Form>
              </Modal>
            )
          }
        </div>
      </div >
    </Spin>
  )
}

export default PacsList;
