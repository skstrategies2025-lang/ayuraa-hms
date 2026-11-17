import React, { useState } from 'react';
import { Receipt, Search, Plus, Printer, ShieldCheck, Building2, X } from 'lucide-react';
import { AyurStorage } from '../services/storage';
export const BillingView = ({ invoices, patients, config, currentBranch }) => {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(invoices[0] || null);
  const [showNewBillModal, setShowNewBillModal] = useState(false);
  // New Invoice Form state
  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('UPI / QR');
  const [billItems, setBillItems] = useState([
    {
      id: '1',
      description: 'Ayurvedic Consultation & Nadi Pariksha',
      category: 'Consultation',
      quantity: 1,
      unitPrice: 800,
      total: 800,
    },
    {
      id: '2',
      description: '7-Day Shirodhara & Takradhara Session',
      category: 'Panchakarma',
      quantity: 1,
      unitPrice: 8500,
      total: 8500,
    },
  ]);
  const [discount, setDiscount] = useState(0);
  // Insurance TPA fields if Insurance / TPA selected
  const [tpaName, setTpaName] = useState('Star Health & Allied Insurance (AYUSH Coverage)');
  const [policyNo, setPolicyNo] = useState('SH-AYUSH-2026-98210');
  const [preAuthAmount, setPreAuthAmount] = useState(9000);
  const [claimStatus, setClaimStatus] = useState('Pre-Auth Approved');
  const branchInvoices = invoices.filter((i) => i.branchId === currentBranch.id);
  const filteredInvoices = branchInvoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(search.toLowerCase()) ||
      inv.uhid.toLowerCase().includes(search.toLowerCase());
    const matchesPayment =
      paymentFilter === 'All'
        ? true
        : paymentFilter === 'Insurance'
          ? inv.paymentMode.includes('Insurance')
          : inv.paymentMode.includes(paymentFilter);
    return matchesSearch && matchesPayment;
  });
  const totalBilled = branchInvoices.reduce((acc, curr) => acc + curr.grandTotal, 0);
  const insuranceBilled = branchInvoices
    .filter((i) => i.paymentMode === 'Insurance / TPA')
    .reduce((acc, curr) => acc + curr.grandTotal, 0);
  // Bill items calculation for modal
  const subTotal = billItems.reduce((acc, curr) => acc + curr.total, 0);
  const taxAmount = Math.round(subTotal * 0.05); // 5% GST
  const grandTotal = Math.max(0, subTotal + taxAmount - discount);
  const handleAddItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      description: 'Medicines / Therapy item',
      category: 'Panchakarma',
      quantity: 1,
      unitPrice: 1500,
      total: 1500,
    };
    setBillItems([...billItems, newItem]);
  };
  const handleCreateInvoice = (e) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === patientId) || patients[0];
    const newInv = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: pat.id,
      patientName: pat.name,
      uhid: pat.uhid,
      date: invoiceDate,
      items: billItems,
      subTotal: subTotal,
      taxAmount: taxAmount,
      discount: discount,
      grandTotal: grandTotal,
      paymentMode: paymentMode,
      paymentStatus: paymentMode === 'Insurance / TPA' ? 'Insurance Claimed' : 'Paid',
      insuranceDetails:
        paymentMode === 'Insurance / TPA'
          ? {
              tpaName,
              policyNumber: policyNo,
              claimId: `CLM-${Math.floor(10000 + Math.random() * 90000)}`,
              preAuthAmount: preAuthAmount,
              claimStatus: claimStatus,
            }
          : undefined,
      branchId: currentBranch.id,
    };
    AyurStorage.addInvoice(newInv);
    setSelectedInvoice(newInv);
    setShowNewBillModal(false);
  };
  return (
    <div className="space-y-6">
      {/* Title & Top Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-serif font-black text-stone-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-700" />
            Billing, Invoicing & AYUSH Insurance (TPA) Desk
          </h2>
          <p className="text-xs text-stone-500">
            Cashless AYUSH insurance claims, Panchakarma package billing, pharmacy settlements, and GST invoices
          </p>
        </div>

        <button
          onClick={() => setShowNewBillModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* Financial Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-card">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Total Revenue Billed (Unit {currentBranch.code})
          </span>
          <div className="text-2xl font-bold text-emerald-700">₹{totalBilled.toLocaleString()}</div>
          <div className="text-xs text-stone-500 mt-1">{branchInvoices.length} invoices generated</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-card">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> AYUSH Insurance / TPA Claims
          </span>
          <div className="text-2xl font-bold text-amber-700">₹{insuranceBilled.toLocaleString()}</div>
          <div className="text-xs text-stone-500 mt-1">Pre-authorized cashless settlements</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-card">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> Centralized Unit Audit
          </span>
          <div className="text-base font-bold text-stone-900 mt-1">{currentBranch.name}</div>
          <div className="text-xs text-stone-500 mt-0.5">GSTIN: {config.gstNumber}</div>
        </div>
      </div>

      {/* Main Grid: Invoices List (5 cols) + Printable Bill Preview (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of Invoices (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search invoice #, patient, UHID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-1 bg-stone-50 p-1 rounded-xl border border-stone-200 text-[11px]">
              {['All', 'UPI', 'Cash', 'Insurance'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPaymentFilter(tab)}
                  className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                    paymentFilter === tab
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-1">
            {filteredInvoices.map((inv) => {
              const isSelected = selectedInvoice?.id === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 text-stone-900 shadow ring-1 ring-emerald-500/30'
                      : 'bg-stone-50 border-stone-200/80 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-700">{inv.invoiceNumber}</span>
                    <span className="text-[10px] text-stone-500">{inv.date}</span>
                  </div>

                  <div className="text-xs font-bold text-stone-900 mt-1">
                    {inv.patientName} <span className="font-mono text-stone-500 text-[10px]">({inv.uhid})</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-stone-200/80 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      ₹{inv.grandTotal.toLocaleString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.paymentMode === 'Insurance / TPA'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {inv.paymentMode}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Invoice Details & Printable Letterhead (7 cols) */}
        {selectedInvoice ? (
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-stone-900 text-base">Invoice Preview: {selectedInvoice.invoiceNumber}</h3>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Tax Invoice</span>
              </button>
            </div>

            {/* White Bill Sheet */}
            <div className="bg-white text-stone-900 p-6 rounded-xl font-sans text-xs space-y-4 shadow-inner">
              <div className="border-b-2 border-emerald-200 pb-3 flex justify-between items-start">
                <div>
                  <h4 className="font-serif font-black text-lg text-emerald-900">{config.hospitalName}</h4>
                  <div className="text-[11px] text-stone-600">{currentBranch.name}</div>
                  <div className="text-[10px] text-stone-500">
                    {currentBranch.address} • Ph: {currentBranch.phone}
                  </div>
                  <div className="text-[10px] text-stone-500">
                    GSTIN: <strong>{config.gstNumber}</strong> • Clinical Reg:{' '}
                    <strong>{config.registrationNumber}</strong>
                  </div>
                </div>
                <div className="text-right text-[11px]">
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold mb-1">
                    TAX INVOICE
                  </span>
                  <div>
                    <strong>Invoice #:</strong> {selectedInvoice.invoiceNumber}
                  </div>
                  <div>
                    <strong>Date:</strong> {selectedInvoice.date}
                  </div>
                </div>
              </div>

              {/* Patient Bar */}
              <div className="bg-stone-50 p-2.5 rounded border border-stone-200 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-stone-500">Patient:</span> <strong>{selectedInvoice.patientName}</strong>
                </div>
                <div>
                  <span className="text-stone-500">UHID:</span>{' '}
                  <strong className="font-mono text-emerald-900">{selectedInvoice.uhid}</strong>
                </div>
                <div>
                  <span className="text-stone-500">Payment Status:</span>{' '}
                  <strong className="text-emerald-800">{selectedInvoice.paymentStatus}</strong>
                </div>
                <div>
                  <span className="text-stone-500">Method:</span> <strong>{selectedInvoice.paymentMode}</strong>
                </div>
              </div>

              {/* Insurance Details Box if applicable */}
              {selectedInvoice.insuranceDetails && (
                <div className="bg-amber-50 p-3 rounded border border-amber-200 text-[11px] space-y-1">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    AYUSH Insurance / TPA Pre-Authorization Slip
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-stone-700 text-[10px] pt-1">
                    <div>
                      TPA Partner: <strong>{selectedInvoice.insuranceDetails.tpaName}</strong>
                    </div>
                    <div>
                      Policy #: <strong className="font-mono">{selectedInvoice.insuranceDetails.policyNumber}</strong>
                    </div>
                    <div>
                      Claim Reference: <strong className="font-mono">{selectedInvoice.insuranceDetails.claimId}</strong>
                    </div>
                    <div>
                      Pre-Auth Status:{' '}
                      <strong className="text-emerald-800">{selectedInvoice.insuranceDetails.claimStatus}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items Table */}
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b-2 border-stone-300 text-stone-700 bg-stone-100">
                    <th className="py-1.5 px-2">#</th>
                    <th className="py-1.5 px-2">Description / Department</th>
                    <th className="py-1.5 px-2 text-center">Qty</th>
                    <th className="py-1.5 px-2 text-right">Unit Rate</th>
                    <th className="py-1.5 px-2 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-2 px-2 font-bold">{idx + 1}</td>
                      <td className="py-2 px-2">
                        <div className="font-bold text-stone-900">{item.description}</div>
                        <span className="text-[10px] text-stone-500">{item.category}</span>
                      </td>
                      <td className="py-2 px-2 text-center font-bold">{item.quantity}</td>
                      <td className="py-2 px-2 text-right font-mono">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold">₹{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="pt-3 border-t border-stone-200 space-y-1 text-right text-[11px]">
                <div>
                  Sub Total: <strong className="font-mono">₹{selectedInvoice.subTotal.toLocaleString()}</strong>
                </div>
                <div>
                  CGST + SGST (5%): <strong className="font-mono">₹{selectedInvoice.taxAmount.toLocaleString()}</strong>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="text-emerald-700">Discount: -₹{selectedInvoice.discount}</div>
                )}
                <div className="text-base font-bold text-emerald-950 pt-1 border-t">
                  Grand Total: <strong className="font-mono">₹{selectedInvoice.grandTotal.toLocaleString()}</strong>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t border-stone-200 flex justify-between items-end text-[10px] text-stone-500">
                <div>
                  <span>Generated electronically by AyurSutra HMS ERP.</span>
                  <br />
                  <span>Original for Recipient</span>
                </div>
                <div className="text-center">
                  <div className="font-bold text-stone-800">Authorized Signatory / Accounts Desk</div>
                  <div>{config.hospitalName}</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* MODAL: GENERATE NEW BILL */}
      {showNewBillModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-xl w-full p-6 text-stone-900 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h3 className="font-bold text-base text-stone-900">Create New Hospital Invoice</h3>
              <button onClick={() => setShowNewBillModal(false)} className="text-stone-500 hover:text-stone-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Select Patient</label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.uhid})
                    </option>
                  ))}
                </select>
              </div>

              {/* Line items editor */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-stone-700 font-semibold">Billable Line Items</label>
                  <button type="button" onClick={handleAddItem} className="text-amber-700 font-bold hover:underline">
                    + Add Line Item
                  </button>
                </div>

                <div className="space-y-2">
                  {billItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...billItems];
                            updated[idx].description = e.target.value;
                            setBillItems(updated);
                          }}
                          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-stone-900"
                        />
                      </div>
                      <div className="col-span-3">
                        <select
                          value={item.category}
                          onChange={(e) => {
                            const updated = [...billItems];
                            updated[idx].category = e.target.value;
                            setBillItems(updated);
                          }}
                          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-stone-900 text-[11px]"
                        >
                          <option value="Consultation">Consultation</option>
                          <option value="Panchakarma">Panchakarma</option>
                          <option value="Pharmacy">Pharmacy</option>
                          <option value="IPD Room">IPD Room</option>
                          <option value="Lab Tests">Lab Tests</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={item.total}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...billItems];
                            updated[idx].unitPrice = val;
                            updated[idx].total = val * updated[idx].quantity;
                            setBillItems(updated);
                          }}
                          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-right font-mono font-bold text-amber-700"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => setBillItems(billItems.filter((i) => i.id !== item.id))}
                          className="text-stone-500 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold"
                  >
                    <option value="UPI / QR">UPI / QR Code</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="Insurance / TPA">Insurance / TPA Cashless Claim</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  />
                </div>
              </div>

              {/* Insurance fields if selected */}
              {paymentMode === 'Insurance / TPA' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="font-bold text-amber-700 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> AYUSH TPA Details
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-stone-500 mb-0.5">Insurance / TPA Name</label>
                      <input
                        type="text"
                        value={tpaName}
                        onChange={(e) => setTpaName(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-500 mb-0.5">Policy Number</label>
                      <input
                        type="text"
                        value={policyNo}
                        onChange={(e) => setPolicyNo(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-stone-900 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Totals Summary */}
              <div className="p-3 bg-stone-50 rounded-xl text-right space-y-1">
                <div>Subtotal: ₹{subTotal}</div>
                <div>GST (5%): ₹{taxAmount}</div>
                <div className="text-base font-bold text-amber-700">Total Payable: ₹{grandTotal.toLocaleString()}</div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowNewBillModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
