import { Col, Row } from "antd"
import { BASE_API } from "../../axios"
import { Document, Page, pdfjs } from "react-pdf";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateExactAge, getAccessToken, getUserDetails, makePostCall } from "../../utils/helper";
import './view-notes.scss'

const ViewNotes = ({ viewNotesModal, handleNoteSelection, selectedNote }) => {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker-min.js';

  const [prevNotes, setPrevNotes] = useState([]);

  const { details } = viewNotesModal;
  const { pacs_order } = details;
  const { patient } = pacs_order;

  const customHeaders = {
    Authorization: `Bearer ${getAccessToken()}`, // Add your token here
  };

  const user_id = getUserDetails()?.username;

  useEffect(() => {
    fetchPrevNotes();
  }, []);

  const fetchPrevNotes = () => {
    const { pacs_order } = viewNotesModal?.details;
    const { patient } = pacs_order;
    const { pat_pin } = patient;

    const payload = {
      user_id,
      pin: pat_pin,
      order_id: pacs_order.his_ord_no,
      ord_no: pacs_order.his_ord_no
    }
    makePostCall("/pat-prev-notes", payload)
      .then(res => {
        console.log("Res", res);
        setPrevNotes(res.data?.data || []);
      })
      .catch(e => {
        console.log("Error", e);
        setPrevNotes([]);
      })
  }

  return (
    <div className="view-notes-container">
      <div className='notes-header'>RIS NOTES</div>
      <div >
        <div style={{ width: '1000px' }}>
          <Row>
            <Col span={8}>
              <span className='notes-label'>Name: </span>
              <span className='notes-value'>{patient?.pat_name}</span>
            </Col>
            <Col span={8}>
              <span className='notes-label'>PIN: </span>
              <span className='notes-value'>{patient?.pat_pin}</span>
            </Col>
            <Col span={8}>
              <span className='notes-label'>Age: </span>
              <span className='notes-value'>{calculateExactAge(patient?.pat_dob)}</span>
            </Col>
          </Row>
          <Row>
            <Col span={8}>
              <span className='notes-label'>Order No: </span>
              <span className='notes-value'>{pacs_order?.po_his_ord_no}</span>
            </Col>
            <Col span={8}>
              <span className='notes-label'>Accession No: </span>
              <span className='notes-value'>{pacs_order?.po_acc_no}</span>
            </Col>
            <Col span={8}>
              <span className='notes-label'>Ref Doc: </span>
              <span className='notes-value'>{pacs_order?.po_ref_doc}</span>
            </Col>
          </Row>
        </div>
      </div>
      <Row className='mt-3'>
        <Col span={8}>
          <div className='notes-list'>
            {prevNotes?.map(dateNote => (
              <div>
                <div className="notes-date">
                  {dateNote.creationdate}
                </div>
                {dateNote?.rows?.map(note => (
                  <div
                    className={`notes-list-item ${note.rn_id === selectedNote?.rn_id ? 'selected' : ''}`}
                    onClick={() => { handleNoteSelection(note, viewNotesModal?.details) }}
                  >
                    {`${note.rn_upload_type?.toUpperCase()} ${note.rn_file_name ? ' | ' + note.rn_file_name : ''} | ${note.rn_acc_no || ''}`}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Col>
        <Col span={16}>
          <div className='notes-detail' style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {
              selectedNote?.rn_upload_type === 'notes' ? (
                <div>
                  {selectedNote?.rn_notes}
                </div>
              ) : (
                selectedNote?.rn_upload_path && (<Document
                  // file={{ url: `http://localhost:4000/uploads/400583092/557780/401080713/prescription/OldHIS3.pdf`, httpHeaders: customHeaders }}
                  file={{ url: `${BASE_API}/uploads/${selectedNote?.rn_upload_path}`, httpHeaders: customHeaders }}
                  // file={`${BASE_API}/uploads/${selectedNote?.rn_upload_path}`}
                  onLoadError={(error) => console.error('Failed to load PDF', error)}
                >
                  <Page pageNumber={1} />
                </Document>)
              )
            }
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default ViewNotes
