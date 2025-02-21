import { Button, Input, Modal, Select, Table, Space, DatePicker, message, Tabs, Upload, Row, Col, Spin, Form } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { orderColumns } from './constants';
import "./dispatch.scss";
import FloatLabel from '../../components/FloatingLabel';
import { getUserDetails, hisStatusOptions, makePostCall } from '../../utils/helper';

import dayjs from 'dayjs';
import FyzksInput from '../../components/FyzksInput';
import { debounce } from 'lodash';
import ReportViewer from '../ReportViewer';
import { useForm } from 'antd/es/form/Form';

const { RangePicker } = DatePicker;

const DispatchList = ({ isConsultant }) => {
  const [orders, setOrders] = useState({ data: [], loading: true });
  const [filters, setFilters] = useState({});
  // const [savedFilters, setSavedFilters] = useState([]);
  const userDetails = getUserDetails();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [refreshDisabled, setRefreshDisabled] = useState(false);
  const [viewreportModal, setViewReportModal] = useState({ visible: false, pdfData: null });
  const [receiverModal, setReceiverModal] = useState({ visible: false, details: null });

  const [receiverForm] = useForm();

  const today = dayjs();
  const yesterday = dayjs().subtract(1, 'days');

  // Set the default value to [yesterday, today]
  const [dateRange, setDateRange] = useState([yesterday, today]);
  const [printLoading, setPrintLoading] = useState(false);

  const isDispatchUser = userDetails?.user_type === 'dispatch';

  useEffect(() => {
    getDispatchList();
  }, []);

  const getDispatchList = async () => {
    makePostCall('/dispatch-list', {
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

  const openReport = async (record) => {
    // if (!record?.po_reported_by || record?.po_reported_by === getUserDetails().username) {
    //   setReportEditorModal({ visible: true, data: record });
    //   window.open(`/viewer?StudyInstanceUIDs=${record?.po_study_uid}`, '_blank')
    // } else {
    //   message.error(`Study is taken by ${record.po_reported_by}`)
    // }
    if (isConsultant) {
      window.open(`/viewer?StudyInstanceUIDs=${record?.po_study_uid}`, '_blank');
    }
    // printReport(record)
    captureReceiver(record);
  }

  const filterResults = () => {
    setOrders({ loading: true, data: [] });
    const payload = { ...filters };

    if (dateRange) {
      payload['from_date'] = dayjs(dateRange[0]).format('YYYYMMDD');
      payload['to_date'] = dayjs(dateRange[1]).format('YYYYMMDD');
      payload['po_study_date'] = dateRange;
    }

    makePostCall('/dispatch-list', payload)
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

  const refreshOrders = () => {
    setRefreshDisabled(true); // Disable the button
    setTimeout(() => {
      setRefreshDisabled(false); // Re-enable the button after 5 seconds
    }, 20000);
    filterResults();
  }

  const debouncedRefresh = useCallback(
    debounce(() => {
      refreshOrders();
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
  };

  const captureReceiver = (rec) => {
    setReceiverModal({ visible: true, details: rec });
  }

  const captureAndPrint = () => {
    const receiverInfo = receiverForm.getFieldsValue();
    printReport(receiverModal?.details, receiverInfo);
  }

  const printReport = async (rec, receiverInfo) => {
    const { pacs_order } = rec;
    const { receiver_mobile, receiver_name } = receiverInfo || {};
    setReceiverModal({ visible: false })
    setPrintLoading(true);
    makePostCall('/print-acc-report', {
      order_id: pacs_order.pacs_ord_id,
      user_id: userDetails?.username,
      fromDispatch: !isConsultant || userDetails?.user_type === 'dispatch',
      received_by: receiverInfo ? `${receiver_name} | ${receiver_mobile}` : null
    }, {
      responseType: "arraybuffer",
    })
      .then(async (res) => {
        const pdfBlob = new Blob([res.data], { type: "application/pdf" });

        const pdf_url = URL.createObjectURL(pdfBlob);

        setPrintLoading(false);
        const buffer = await pdfBlob.arrayBuffer()

        if (isConsultant) {
          setViewReportModal({ visible: true, pdfData: buffer, pdfBlob: pdfBlob, pdf_url })
        } else {
          // setPdfUrl(url);
          const printWindow = window.open(pdf_url, "_blank");
          printWindow.print();
        }
      })
      .catch(err => {
        console.log("Error", err);
        setPrintLoading(false);
      })
  }

  return (
    <Spin spinning={printLoading}>
      <div className='dispatch-container'>
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
              <Select allowClear style={{ width: 200 }} options={statusOptions} onChange={(val) => handleFilterChange('po_ref_doc', val)} />
            </FloatLabel>
            <FloatLabel label="Body Part / Study Desc" value={filters['po_body_part']} className="me-3">
              <FyzksInput width={200} onChange={(e) => handleFilterChange('po_body_part', e.target.value)} />
            </FloatLabel>
            <FloatLabel label="HIS Status" value={filters['po_his_status']} className="me-3">
              <Select allowClear style={{ width: 200 }} options={hisStatusOptions} onChange={(val) => handleFilterChange('po_his_status', val)} />
            </FloatLabel>

            <FloatLabel label="Order No" value={filters['po_ord_no']} className="me-3">
              <FyzksInput width={200} onChange={(e) => handleFilterChange('po_ord_no', e.target.value)} />
            </FloatLabel>
            <FloatLabel label="Status" value={filters['status']} className="me-3">
              <Select allowClear style={{ width: 200 }} options={statusOptions} onChange={(val) => handleFilterChange('status', val)} />
            </FloatLabel>
            <FloatLabel label="Site" value={filters['site']} className="me-3">
              <Select allowClear style={{ width: 200 }} options={siteOptions} onChange={(val) => handleFilterChange('site', val)} />
            </FloatLabel>
            <FloatLabel label="Modality" value={filters['modality']} className="me-3">
              <Select allowClear style={{ width: 200 }} options={modalityOptions} onChange={(val) => handleFilterChange('modality', val)} />
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
          {/* <Button className='ms-3' type='primary' onClick={() => { setSaveFiltersModal({ visible: true }) }}>Save Filters</Button> */}
          {/* <Button disabled={refreshDisabled} className='!ms-auto ms-3' type='dashed' danger onClick={() => { debouncedRefresh() }} >Refresh</Button> */}
        </div>
        <div className='orders-list'>
          <Table
            tableLayout="fixed"
            // rowSelection={rowSelection}
            loading={orders.loading}
            columns={orderColumns({ openReportEditor: openReport, role: userDetails?.user_type, printReport, captureReceiver })}
            rowKey={(rec) => rec.po_acc_no}
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
        </div>
      </div >
      {
        viewreportModal && viewreportModal?.visible && (
          <Modal
            open={viewreportModal.visible}
            onCancel={() => { setViewReportModal({ visible: false, pdfData: null }) }}
            width={900}
            className='viewer-modal'
          >
            <ReportViewer pdfData={viewreportModal?.pdfData} pdfBlob={viewreportModal?.pdfBlob} pdf_url={viewreportModal?.pdf_url} />
          </Modal>
        )
      }
      {
        receiverModal && receiverModal.visible && (
          <Modal
            open={receiverModal.visible}
            onCancel={() => { setReceiverModal(null) }}
            onOk={() => { setReceiverModal(null) }}
            width={'600px'}
            okButtonProps={{ style: { display: 'none' } }}
            className='receiver-modal'
          >
            <div style={{ padding: '1rem 0.5rem' }}>
              <Form form={receiverForm} onFinish={() => { captureAndPrint() }}>
                <Form.Item name="receiver_name" label="Receiver Name" rules={[{
                  required: true
                }]}>
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
                <Form.Item className='text-center'>
                  <div>
                    <Button type='primary' htmlType='submit' style={{ width: '300px' }}>Proceed</Button>
                  </div>
                  <div>
                    <Button type='link' onClick={() => printReport(receiverModal?.details)}>Continue without Info</Button>
                  </div>
                </Form.Item>
              </Form>
            </div>
          </Modal>
        )
      }
    </Spin>
  )
}

export default DispatchList;
