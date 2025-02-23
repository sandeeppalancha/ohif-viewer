import { Button, Input, Modal, Select, Table, Space, DatePicker } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { orderColumns } from './constants';
import ReportEditor from '../ReportEditor';
import "./worklist.css";
import FloatLabel from '../../components/FloatingLabel';
import axiosInstance, { BASE_API } from '../../axios';
import { getUserDetails, hisStatusOptions, makePostCall } from '../../utils/helper';
import dayjs from 'dayjs';
import FyzksInput from '../../components/FyzksInput';
import { debounce } from 'lodash';
import ViewNotes from '../ManageNodes/ViewNotes';

const { RangePicker } = DatePicker;

const MyWorklist = () => {
  const [orders, setOrders] = useState({ data: [], loading: true });
  const [reportEditorModal, setReportEditorModal] = useState({ visible: false, data: {} });
  const [filters, setFilters] = useState({});
  const userDetails = getUserDetails();
  const [userList, setUserList] = useState([]);
  // Set the default value to [yesterday, today]
  const today = dayjs();
  const yesterday = dayjs().subtract(1, 'days');
  const [dateRange, setDateRange] = useState([yesterday, today]);
  const [refreshDisabled, setRefreshDisabled] = useState(false);

  const [viewNotesModal, setViewNotesModal] = useState({ visible: false, details: null });
  const [selectedNote, setSelectedNote] = useState({});

  useEffect(() => {
    // getOrdersList();
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
    const { proxy_user, co_signing_doctor } = moreInfo
    makePostCall('/submit-report', {
      html: newContent,
      yh_no: reportEditorModal.data?.po_pin,
      order_no: reportEditorModal.data?.po_ord_no,
      order_id: reportEditorModal?.data?.pacs_order?.pacs_ord_id,
      acc_no: reportEditorModal.data?.po_acc_no,
      user_id: getUserDetails()?.username,
      ...moreInfo,
      proxy_user: proxy_user,
      co_signing_doctor: co_signing_doctor,
      status,
      report_id: currentReport?.pr_id,
    })
      .then(res => {
        callback && callback();
      })
      .catch(e => {
        console.log(e);
      });
  }


  const getOrdersList = async () => {
    makePostCall('/my-worklist', {
      role: userDetails?.user_type,
      user_id: getUserDetails()?.username,
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

  const openReport = (record) => {
    setReportEditorModal({ visible: true, data: record })
  }

  const filterResults = (tempFilters) => {
    setOrders({ loading: true, data: [] });
    const payload = { ...tempFilters };
    payload['role'] = userDetails?.user_type;
    payload['user_id'] = getUserDetails()?.username;

    if (dateRange) {
      payload['from_date'] = dayjs(dateRange[0]).format('YYYYMMDD');
      payload['to_date'] = dayjs(dateRange[1]).format('YYYYMMDD');
      payload['po_study_date'] = dateRange;
    }

    makePostCall('/my-worklist', payload)
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
    }, 20000);
    axiosInstance.get(BASE_API + '/update-status')
      .then(res => {
        // console.log("res", res);
        filterResults(filters);
      })
      .catch(e => {
        console.log(e);
      })
  }

  const debouncedRefresh = useCallback(
    debounce(() => {
      console.log('Debounced value:');
      refreshScanStatus();
    }, 200),
    []
  );

  const statusOptions = userDetails?.user_type === 'doc' ? [
    { label: 'REVIEWED', value: 'REVIEWED' },
    { label: 'SIGNEDOFF', value: 'SIGNEDOFF' },
  ] :
    [
      { label: 'PENDING', value: 'PENDING' },
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
  ];

  const reportedByOptions = useMemo(() => {
    return userList?.map((user) => ({ label: user.user_fullname, value: user.username }))
  }, [userList]);

  const viewNotes = (rec) => {
    console.log("view notes", rec);
    const firstNote = rec.pacs_order?.ris_notes[0] || {};
    setSelectedNote(firstNote)
    setViewNotesModal({ visible: true, details: rec })
  }

  const handleNoteSelection = (note, record) => {
    setSelectedNote(note);
  }

  const clearFilters = () => {
    setFilters({});
    setDateRange(null);
    // getOrdersList();
  }

  return (
    <div>
      <div className='filters-section'>
        {/* <Space.Compact> */}
        {/* <span style={{ width: 140 }} className='!ms-3'>Patient Name</span> */}
        <div className='d-flex flex-wrap'>
          <FloatLabel label="Patient Name" value={filters['pat_name']} className="me-3">
            <FyzksInput value={filters['pat_name']} onChange={(e) => handleFilterChange('pat_name', e.target.value)} />
          </FloatLabel>
          <FloatLabel label="YH No" value={filters['po_pin']} className="me-3">
            <FyzksInput width={200} onChange={(e) => handleFilterChange('po_pin', e.target.value)} />
          </FloatLabel>
          <FloatLabel label="Acc. No" value={filters['po_acc_no']} className="me-3">
            <FyzksInput width={200} onChange={(e) => handleFilterChange('po_acc_no', e.target.value)} />
          </FloatLabel>
          <FloatLabel label="Ref Doc." value={filters['po_ref_doc']} className="me-3">
            <Select style={{ width: 200 }} options={statusOptions} onChange={(val) => handleFilterChange('po_ref_doc', val)} />
          </FloatLabel>
          <FloatLabel label="Body Part / Study Desc" value={filters['po_body_part']} className="me-3">
            <FyzksInput width={200} onChange={(e) => handleFilterChange('po_body_part', e.target.value)} />
          </FloatLabel>
          <FloatLabel label="HIS Status" value={filters['po_his_status']} className="me-3">
            <Select style={{ width: 200 }} options={hisStatusOptions} onChange={(val) => handleFilterChange('po_his_status', val)} />
          </FloatLabel>

          <FloatLabel label="Order No" value={filters['po_ord_no']} className="me-3">
            <FyzksInput width={200} onChange={(e) => handleFilterChange('po_ord_no', e.target.value)} />
          </FloatLabel>
          <FloatLabel label="Status" value={filters['po_status']} className="me-3">
            <Select style={{ width: 200 }} options={statusOptions} onChange={(val) => handleFilterChange('po_status', val)} />
          </FloatLabel>
          <FloatLabel label="Site" value={filters['po_site']} className="me-3">
            <Select style={{ width: 200 }} options={siteOptions} onChange={(val) => handleFilterChange('po_site', val)} />
          </FloatLabel>
          <FloatLabel label="Modality" value={filters['modality']} className="me-3">
            <Select style={{ width: 200 }} options={modalityOptions} onChange={(val) => handleFilterChange('modality', val)} />
          </FloatLabel>
          <FloatLabel label="Reported By" value={filters['po_reported_by']} className="me-3">
            <Select
              showSearch
              style={{ width: 200 }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={reportedByOptions}
              onChange={(val) => handleFilterChange('po_reported_by', val)}
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
        <Button className='ms-4' type='primary' onClick={() => filterResults(filters)}>Search Worklist</Button>
        <Button className='ms-3' type='default' onClick={() => { clearFilters() }}>Clear Filters</Button>
        {/* <Button className='!ms-auto ms-3' type='dashed' danger onClick={() => { debouncedRefresh() }} >Refresh</Button> */}
      </div>
      <div className='orders-list'>
        <Table
          tableLayout='fixed'
          style={{ width: '100%' }}
          loading={orders.loading}
          columns={orderColumns({ openReportEditor: openReport, viewNotes })}
          dataSource={orders.data || []}
          onRow={(record, rowIndex) => {
            return {
            }
          }}
          scroll={{
            x: 1200
          }}
        />
        {reportEditorModal.visible && (
          <Modal className='report-modal' width={'100%'} onCancel={() => { setReportEditorModal({ visible: false }) }} footer={null} open={reportEditorModal.visible}>
            <ReportEditor cancel={cancelReport} onSave={onSave} patientDetails={reportEditorModal.data} />
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
      </div>
    </div>
  );
}

export default MyWorklist;
