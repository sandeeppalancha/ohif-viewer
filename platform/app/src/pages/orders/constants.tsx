import { Button, Tag, Tooltip } from "antd";
import React from "react";
import { FileTextOutlined } from '@ant-design/icons';

const statusColors = {
  'PENDING': 'red',
  'DRAFTED': 'orange',
  'REPORT_SUBMITTED': 'yellow',
  'SIGNEDOFF': 'green',
  'REVIEWED': 'blue',
};

export const orderColumns = (openReportEditor) => ([
  {
    dataIndex: "po_pat_name",
    title: "Patient Name",
    render: (text, record) => {
      return (
        <Tooltip title={record.pacs_order?.patient?.pat_name}>
          <Button
            color="blue"
            className="ms1-auto"
            type="link" onClick={() => { openReportEditor(record); window.open(`/viewer?StudyInstanceUIDs=${record?.po_study_uid}`, '_blank') }}
          >
            <span className="whitespace-normal">
              {record.pacs_order?.patient?.pat_name}
            </span>
          </Button>
        </Tooltip>
      )
    },
  },
  {
    dataIndex: "po_diag_desc",
    title: "Diag Name",
    render: (txt, rec) => {
      return (
        <Tooltip
          title={rec.pacs_order?.po_emergency === 'Y' ? 'Emergency' : ''}
        >
          <span>
            {rec?.pacs_order?.po_diag_desc}
          </span>
        </Tooltip>
      )
    },
    onCell: (record) => ({
      className: record.pacs_order?.po_emergency === 'Y' ? 'emergency' : ''
    }),
  },
  {
    dataIndex: "po_pin",
    title: "Patient ID",
    render: (text, rec) => rec?.pacs_order?.patient?.pat_pin
  },
  {
    dataIndex: "po_ord_no",
    title: "Order No",
    render: (text, rec) => rec?.pacs_order?.po_his_ord_no
  },
  {
    dataIndex: "po_acc_no",
    title: "Accession No",
    render: (text, rec) => rec?.pacs_order?.po_acc_no
  },
  {
    dataIndex: "po_site",
    title: "Site",
    render: (text, rec) => rec?.pacs_order?.po_site
  },
  {
    dataIndex: "po_body_part",
    title: "Body Part",
    render: (text, rec) => rec?.pacs_order?.po_body_part
  },
  {
    dataIndex: "po_assigned_to",
    title: "Assigned To",
    render: (val, rec) => {
      return `${rec?.order_workflow?.ow_assigned_technician}`
    }
  },
  {
    dataIndex: "po_ref_doc",
    title: "Ref Doc",
    render: (text, rec) => rec?.pacs_order?.po_ref_doc
  },
  {
    dataIndex: "po_status",
    title: "Status",
    render: (text, record) => {
      const pacs_status = record?.pacs_order?.po_pacs_status;
      return (
        <>
          <Tag color={statusColors[pacs_status]}>{pacs_status?.replaceAll('_', ' ')}</Tag>
        </>
      )
    },
  }
]);


export const SavedSearches = ({ savedFilters, handleFilterSelection }) => {

  return (
    <div className="mb-2">
      <span> Saved Filters:</span>
      {savedFilters.map((filter, index) => (
        <span key={filter.uf_name} className="ml-2"><Tag color='orange' onClick={() => handleFilterSelection(filter)} style={{ color: 'orange' }}>{filter.uf_name}</Tag></span>
      ))
      }
    </div >
  )
}
