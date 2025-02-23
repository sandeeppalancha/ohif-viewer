import { Button, Input, Modal, Select, Table, Space, DatePicker } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { SavedSearches, orderColumns } from './constants';
import ReportEditor from '../ReportEditor';
import "./orders.css";
import FloatLabel from '../../components/FloatingLabel';
import axiosInstance, { BASE_API } from '../../axios';
import { getUserDetails, hisStatusOptions, makePostCall } from '../../utils/helper';
import dayjs from 'dayjs';
import FyzksInput from '../../components/FyzksInput';
import { debounce } from 'lodash';

const { RangePicker } = DatePicker;

const OrdersList = () => {
  const [orders, setOrders] = useState({ data: [], loading: true });
  const [reportEditorModal, setReportEditorModal] = useState({ visible: false, data: {} });
  const [saveFiltersModal, setSaveFiltersModal] = useState({ visible: false, data: {} });
  const [filterName, setFilterName] = useState(null);
  const [filters, setFilters] = useState({});
  const [savedFilters, setSavedFilters] = useState([]);
  const userDetails = getUserDetails();
  const today = dayjs();
  const yesterday = dayjs().subtract(1, 'days');

  const userType = userDetails?.user_type;

  // Set the default value to [yesterday, today]
  const [dateRange, setDateRange] = useState([yesterday, today]);

  const isHOD = userDetails?.user_type === 'hod';

  useEffect(() => {
    // getOrdersList();
    getSavedFilters();
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

  const onSave = (newContent, status, currentReport, moreInfo, callback) => {
    const { proxy_user, co_signing_doctor } = moreInfo;
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
        // console.log("resp", res);
        callback && callback();
      })
      .catch(e => {
        console.log(e);
      });
  }


  const getOrdersList = async () => {
    makePostCall('/orders', {
      role: userDetails?.user_type,
    })
      .then(res => {
        // console.log("resp", res);
        setOrders({ data: res.data?.data || [], loading: false })
      })
      .catch(e => {
        console.log(e);
        setOrders({ data: [], loading: false })
      });
  }

  const cancelReport = () => {
    // console.log("cancel report");
    setReportEditorModal({ visible: false, data: {} });
  }

  const openReport = (record) => {
    return;
    setReportEditorModal({ visible: true, data: record })
  }

  const getSavedFilters = async () => {
    makePostCall('/get-saved-filters', { user_id: getUserDetails()?.username })
      .then(res => {
        // console.log("resp", res);
        setSavedFilters(res.data?.data || []);
      })
      .catch(e => {
        console.log(e);
        setSavedFilters([]);
      });
  }

  const submitSaveFilters = () => {
    const payload = {
      filters: JSON.stringify(filters),
      uf_filter_name: filterName,
      user_id: getUserDetails()?.username
    };
    // console.log("Filters", payload);
    makePostCall('/save-my-filters', payload)
      .then(res => {
        // console.log("resp", res);
        getSavedFilters();
      })
      .catch(e => {
        console.log(e);
      });
  }

  const clearFilters = () => {
    setFilters({});
    setDateRange(null);
    // getOrdersList();
  }

  const filterResults = (tempFilters) => {
    setOrders({ loading: true, data: [] });
    const payload = { ...tempFilters };

    if (dateRange) {
      payload['from_date'] = dayjs(dateRange[0]).format('YYYYMMDD');
      payload['to_date'] = dayjs(dateRange[1]).format('YYYYMMDD');
      payload['po_study_date'] = dateRange;
    }

    makePostCall('/orders', payload)
      .then(res => {
        // console.log("resp", res);
        setOrders({ data: res.data?.data || [], loading: false })
      })
      .catch(e => {
        console.log(e);
        setOrders({ data: [], loading: false })
      });
  }

  const handleFilterChange = (key, value) => {
    // console.log("handleFilterChange", key, value);
    const temp_filters = { ...filters };
    temp_filters[key] = value;
    setFilters(temp_filters);
  }

  const refreshScanStatus = () => {
    axiosInstance.get(BASE_API + '/update-status')
      .then(res => {
        // console.log("res", res);
        filterResults(filters);
      })
      .catch(e => {
        console.log(e);
      })
  }

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

  const handleFilterSelection = (selectedSavedFilter) => {
    // console.log("selectedSavedFilter", selectedSavedFilter);
    const filterString = selectedSavedFilter.uf_filter_json;
    const filterJson = JSON.parse(filterString);
    // console.log("filter json", filterJson);

    setFilters(filterJson);
  }

  return (
    <div>
      <SavedSearches savedFilters={savedFilters || []} handleFilterSelection={handleFilterSelection} />
      <div className='filters-section'>
        {/* <Space.Compact> */}
        {/* <span style={{ width: 140 }} className='!ms-3'>Patient Name</span> */}
        <div className='d-flex flex-wrap'>
          <FloatLabel label="Patient Name" value={filters['pat_name']} className="me-3">
            <FyzksInput value={filters['pat_name']} onChange={(e) => handleFilterChange('pat_name', e.target.value)} />
          </FloatLabel>

          <FloatLabel label="YH No" value={filters['po_pin']} className="me-3">
            <FyzksInput value={filters['po_pin']} width={200} onChange={(e) => handleFilterChange('po_pin', e.target.value)} />
          </FloatLabel>
          <FloatLabel label="Acc. No" value={filters['po_acc_no']} className="me-3">
            <FyzksInput value={filters['po_acc_no']} width={200} onChange={(e) => handleFilterChange('po_acc_no', e.target.value)} />
          </FloatLabel>
          <FloatLabel label="Ref Doc." value={filters['po_ref_doc']} className="me-3">
            <Select value={filters['po_ref_doc']} allowClear style={{ width: 200 }} options={statusOptions} onChange={(val) => handleFilterChange('po_ref_doc', val)} />
          </FloatLabel>
          <FloatLabel label="Body Part / Study Desc" value={filters['po_body_part']} className="me-3">
            <FyzksInput value={filters['po_body_part']} width={200} onChange={(e) => handleFilterChange('po_body_part', e.target.value)} />
          </FloatLabel>
          <FloatLabel label="HIS Status" value={filters['po_his_status']} className="me-3">
            <Select value={filters['po_his_status']} allowClear style={{ width: 200 }} options={hisStatusOptions} onChange={(val) => handleFilterChange('po_his_status', val)} />
          </FloatLabel>

          <FloatLabel label="Order No" value={filters['po_ord_no']} className="me-3">
            <FyzksInput value={filters['po_ord_no']} width={200} onChange={(e) => handleFilterChange('po_ord_no', e.target.value)} />
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
        <Button className='ms-3' type='primary' onClick={filterResults}>Search</Button>
        <Button className='ms-3' type='default' onClick={() => { clearFilters() }}>Clear Filters</Button>
        <Button className='ms-3' type='primary' onClick={() => { setSaveFiltersModal({ visible: true }) }}>Save Filters</Button>
        {/* <Button className='ms-3' type='dashed' danger onClick={() => { refreshScanStatus() }} >Refresh</Button> */}
      </div>
      <div className='orders-list'>
        <Table loading={orders.loading} columns={orderColumns(openReport)} dataSource={orders.data || []} onRow={(record, rowIndex) => {
          return {
          }
        }} />
        {reportEditorModal.visible && (
          <Modal className='report-modal' width={'100%'} onCancel={() => { setReportEditorModal({ visible: false }) }} footer={null} open={reportEditorModal.visible}>
            <ReportEditor cancel={cancelReport} onSave={onSave} patientDetails={reportEditorModal.data} />
          </Modal>
        )}

        {saveFiltersModal.visible && (
          <Modal className='save-filter-modal' onCancel={() => { setSaveFiltersModal({ visible: false }) }}
            okButtonProps={{ disabled: !filterName }} onOk={submitSaveFilters}
            open={saveFiltersModal.visible}
          >
            <Input width={300} onChange={(e) => setFilterName(e.target.value)} />
          </Modal>
        )}
      </div>
    </div>
  );
}

export default OrdersList;
