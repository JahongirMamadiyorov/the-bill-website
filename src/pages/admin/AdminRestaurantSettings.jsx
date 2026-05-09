import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import {
  Store, DollarSign, Percent, Printer, UtensilsCrossed,
  Receipt, Check, AlertCircle, Upload, X, ImageIcon, Plus, Trash2,
} from 'lucide-react';
import { settingsAPI, menuAPI } from '../../api/client';

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ── Field label wrapper ───────────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>}
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ── Text input ────────────────────────────────────────────────────────────────
function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-colors bg-white"
    />
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, desc }) {
  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
    </div>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────
function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <Toggle checked={!!checked} onChange={onChange} />
    </div>
  );
}

// ── Logo upload ───────────────────────────────────────────────────────────────
function LogoUpload({ value, onChange, t }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const result = await settingsAPI.uploadLogo(file);
      onChange(result.url || result.fullUrl || '');
    } catch {
      setUploadError(t('settings.info.uploadLogo') + ' failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src={value}
              alt="logo"
              className="w-full h-full object-contain p-2"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Upload size={14} />
              {uploading ? t('settings.info.uploading') : t('settings.info.uploadLogo')}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-red-100 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <X size={14} />
              {t('settings.info.removeLogo')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/40 transition-all disabled:opacity-50"
        >
          {uploading ? (
            <span className="text-sm font-medium">{t('settings.info.uploading')}</span>
          ) : (
            <>
              <ImageIcon size={24} />
              <span className="text-sm font-medium">{t('settings.info.uploadLogo')}</span>
              <span className="text-xs">{t('settings.info.uploadLogoHint')}</span>
            </>
          )}
        </button>
      )}
      {uploadError && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} />{uploadError}
        </p>
      )}
    </div>
  );
}

// ── Single printer block (receipt printer) ────────────────────────────────────
function PrinterBlock({ title, desc, ip, port, onIpChange, onPortChange, t }) {
  return (
    <Card>
      <CardHeader title={title} desc={desc} />
      <div className="px-5 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label={t('settings.printers.ip')}>
              <TextInput value={ip} onChange={onIpChange} placeholder={t('settings.printers.ipPlaceholder')} />
            </Field>
          </div>
          <Field label={t('settings.printers.port')}>
            <TextInput value={port} onChange={v => onPortChange(Number(v))} type="number" placeholder="9100" />
          </Field>
        </div>
        {ip ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 text-xs font-medium">
            <Check size={13} className="flex-shrink-0" />
            {ip}:{port || 9100}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg px-3 py-2 text-xs font-medium">
            <AlertCircle size={13} className="flex-shrink-0" />
            {t('settings.printers.notConfigured')}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Kitchen printer card ──────────────────────────────────────────────────────
function KitchenPrinterCard({ printer, stations, onUpdate, onRemove, t }) {
  const { id, name, ip, port } = printer;
  const printerStations = printer.stations || [];

  const toggleStation = (stationName) => {
    const next = printerStations.includes(stationName)
      ? printerStations.filter(s => s !== stationName)
      : [...printerStations, stationName];
    onUpdate(id, 'stations', next);
  };

  return (
    <Card>
      <div className="px-5 py-4 flex flex-col gap-4">
        {/* Name + remove */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Field label={t('settings.printers.printerName')}>
              <TextInput
                value={name}
                onChange={v => onUpdate(id, 'name', v)}
                placeholder={t('settings.printers.printerNamePlaceholder')}
              />
            </Field>
          </div>
          <button
            type="button"
            onClick={() => onRemove(id)}
            title={t('settings.printers.removePrinter')}
            className="mt-5 flex items-center justify-center w-9 h-9 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* IP + port */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label={t('settings.printers.ip')}>
              <TextInput value={ip} onChange={v => onUpdate(id, 'ip', v)} placeholder={t('settings.printers.ipPlaceholder')} />
            </Field>
          </div>
          <Field label={t('settings.printers.port')}>
            <TextInput value={port} onChange={v => onUpdate(id, 'port', Number(v))} type="number" placeholder="9100" />
          </Field>
        </div>

        {/* Status */}
        {ip ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 text-xs font-medium">
            <Check size={13} className="flex-shrink-0" />
            {ip}:{port || 9100}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg px-3 py-2 text-xs font-medium">
            <AlertCircle size={13} className="flex-shrink-0" />
            {t('settings.printers.notConfigured')}
          </div>
        )}

        {/* Stations */}
        {stations.length > 0 && (
          <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">
              {t('settings.printers.assignedStations')}
            </p>
            <div className="flex flex-wrap gap-2">
              {stations.map(s => {
                const active = printerStations.includes(s.name);
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => toggleStation(s.name)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
            {printerStations.length === 0 && (
              <p className="text-xs text-gray-400">{t('settings.printers.noStations')}</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section panels
// ─────────────────────────────────────────────────────────────────────────────

function RestaurantInfoPanel({ form, set, t }) {
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader title={t('settings.sections.restaurantInfo')} />
        <div className="px-5 py-4 flex flex-col gap-4">
          <Field label={t('settings.info.name')}>
            <TextInput value={form.restaurantName} onChange={set('restaurantName')} placeholder={t('settings.info.namePlaceholder')} />
          </Field>
          <Field label={t('settings.info.address')}>
            <TextInput value={form.address} onChange={set('address')} placeholder={t('settings.info.addressPlaceholder')} />
          </Field>
          <Field label={t('settings.info.phone')}>
            <TextInput value={form.phone} onChange={set('phone')} placeholder={t('settings.info.phonePlaceholder')} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title={t('settings.info.uploadLogo')} desc={t('settings.info.uploadLogoHint')} />
        <div className="px-5 py-4">
          <LogoUpload value={form.logoUrl} onChange={set('logoUrl')} t={t} />
        </div>
      </Card>
    </div>
  );
}

function FinancialPanel({ form, set, t }) {
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader title={t('settings.financial.currencySymbol')} />
        <div className="px-5 py-4">
          <Field label={t('settings.financial.currencySymbol')}>
            <TextInput value={form.currencySymbol} onChange={set('currencySymbol')} placeholder={t('settings.financial.currencyPlaceholder')} />
          </Field>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-sm font-semibold text-gray-900">{t('settings.financial.taxEnabled')}</p>
          <Toggle checked={form.taxEnabled} onChange={set('taxEnabled')} />
        </div>
        {form.taxEnabled && (
          <div className="border-t border-gray-100 px-5 py-4">
            <Field label={t('settings.financial.taxRate')}>
              <div className="relative">
                <TextInput value={form.taxRate} onChange={v => set('taxRate')(Number(v))} type="number" placeholder="0" />
                <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </Field>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-sm font-semibold text-gray-900">{t('settings.financial.serviceChargeEnabled')}</p>
          <Toggle checked={form.serviceChargeEnabled} onChange={set('serviceChargeEnabled')} />
        </div>
        {form.serviceChargeEnabled && (
          <div className="border-t border-gray-100 px-5 py-4">
            <Field label={t('settings.financial.serviceChargeRate')}>
              <div className="relative">
                <TextInput value={form.serviceChargeRate} onChange={v => set('serviceChargeRate')(Number(v))} type="number" placeholder="0" />
                <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </Field>
          </div>
        )}
      </Card>
    </div>
  );
}

function PrintersPanel({ form, set, t }) {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    menuAPI.getStations()
      .then(data => setStations(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const addPrinter = () => {
    const newPrinter = {
      id: Date.now().toString(),
      name: '',
      ip: '',
      port: 9100,
      stations: [],
    };
    set('kitchenPrinters')([...(form.kitchenPrinters || []), newPrinter]);
  };

  const updatePrinter = (id, field, value) => {
    set('kitchenPrinters')(
      (form.kitchenPrinters || []).map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };

  const removePrinter = (id) => {
    set('kitchenPrinters')((form.kitchenPrinters || []).filter(p => p.id !== id));
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Main receipt printer */}
      <PrinterBlock
        title={t('settings.printers.mainPrinter')}
        ip={form.printerIp}
        port={form.printerPort}
        onIpChange={set('printerIp')}
        onPortChange={v => set('printerPort')(v)}
        t={t}
      />

      {/* Kitchen printers */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">{t('settings.printers.kitchenPrinters')}</p>
          <button
            type="button"
            onClick={addPrinter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
          >
            <Plus size={13} />
            {t('settings.printers.addKitchenPrinter')}
          </button>
        </div>

        {(form.kitchenPrinters || []).length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 gap-2">
            <Printer size={24} className="opacity-40" />
            <p className="text-sm">{t('settings.printers.addKitchenPrinter')}</p>
          </div>
        )}

        {(form.kitchenPrinters || []).map(printer => (
          <KitchenPrinterCard
            key={printer.id}
            printer={printer}
            stations={stations}
            onUpdate={updatePrinter}
            onRemove={removePrinter}
            t={t}
          />
        ))}
      </div>

    </div>
  );
}

function ReceiptTemplatePanel({ form, set, t }) {
  return (
    <div className="flex flex-col gap-5">

      {/* Header text — moved here from Printers */}
      <Card>
        <CardHeader title={t('settings.receipt.headerText')} />
        <div className="px-5 py-4">
          <Field>
            <TextInput value={form.receiptHeader} onChange={set('receiptHeader')} placeholder={t('settings.receipt.headerPlaceholder')} />
          </Field>
        </div>
      </Card>

      {/* Toggle options */}
      <Card>
        <CardHeader title={t('settings.sections.receiptTemplate')} desc={t('settings.receipt.title')} />
        <ToggleRow label={t('settings.receipt.showLogo')}          checked={form.receiptShowLogo}          onChange={set('receiptShowLogo')} />
        <ToggleRow label={t('settings.receipt.showOrderNumber')}   checked={form.receiptShowOrderNumber}   onChange={set('receiptShowOrderNumber')} />
        <ToggleRow label={t('settings.receipt.showTableName')}     checked={form.receiptShowTableName}     onChange={set('receiptShowTableName')} />
        <ToggleRow label={t('settings.receipt.showTax')}           checked={form.receiptShowTax}           onChange={set('receiptShowTax')} />
        <ToggleRow label={t('settings.receipt.showServiceCharge')} checked={form.receiptShowServiceCharge} onChange={set('receiptShowServiceCharge')} />
        <ToggleRow label={t('settings.receipt.showFooter')}        checked={form.receiptShowFooter}        onChange={set('receiptShowFooter')} />
      </Card>

      {form.receiptShowFooter && (
        <Card>
          <CardHeader title={t('settings.receipt.footerText')} />
          <div className="px-5 py-4">
            <Field>
              <TextInput value={form.receiptFooter} onChange={set('receiptFooter')} placeholder={t('settings.receipt.footerPlaceholder')} />
            </Field>
          </div>
        </Card>
      )}

    </div>
  );
}

function KitchenTemplatePanel({ form, set, t }) {
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader title={t('settings.sections.kitchenTemplate')} desc={t('settings.kitchen.title')} />
        <ToggleRow label={t('settings.kitchen.showOrderType')}    checked={form.kitchenShowOrderType}    onChange={set('kitchenShowOrderType')} />
        <ToggleRow label={t('settings.kitchen.showTableName')}    checked={form.kitchenShowTableName}    onChange={set('kitchenShowTableName')} />
        <ToggleRow label={t('settings.kitchen.showOrderNumber')}  checked={form.kitchenShowOrderNumber}  onChange={set('kitchenShowOrderNumber')} />
        <ToggleRow label={t('settings.kitchen.showCustomerName')} checked={form.kitchenShowCustomerName} onChange={set('kitchenShowCustomerName')} />
        <ToggleRow label={t('settings.kitchen.showQtyUnit')}      checked={form.kitchenShowQtyUnit}      onChange={set('kitchenShowQtyUnit')} />
        <ToggleRow label={t('settings.kitchen.showItemPrice')}    checked={form.kitchenShowItemPrice}    onChange={set('kitchenShowItemPrice')} />
        <ToggleRow label={t('settings.kitchen.showNotes')}        checked={form.kitchenShowNotes}        onChange={set('kitchenShowNotes')} />
        <ToggleRow label={t('settings.kitchen.showTimestamp')}    checked={form.kitchenShowTimestamp}    onChange={set('kitchenShowTimestamp')} />
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const SECTIONS = [
  { key: 'info',     icon: Store,           labelKey: 'settings.sections.restaurantInfo',  Panel: RestaurantInfoPanel },
  { key: 'finance',  icon: DollarSign,      labelKey: 'settings.sections.financial',       Panel: FinancialPanel },
  { key: 'printers', icon: Printer,         labelKey: 'settings.sections.printers',        Panel: PrintersPanel },
  { key: 'receipt',  icon: Receipt,         labelKey: 'settings.sections.receiptTemplate', Panel: ReceiptTemplatePanel },
  { key: 'kitchen',  icon: UtensilsCrossed, labelKey: 'settings.sections.kitchenTemplate', Panel: KitchenTemplatePanel },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminRestaurantSettings() {
  const { t } = useTranslation();

  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);
  const [activeKey, setActiveKey] = useState('info');

  const [form, setForm] = useState({
    restaurantName: '',
    address: '',
    phone: '',
    logoUrl: '',
    currencySymbol: "so'm",
    receiptHeader: '',
    receiptFooter: '',
    taxRate: 0,
    taxEnabled: false,
    serviceChargeRate: 0,
    serviceChargeEnabled: false,
    printerIp: '',
    printerPort: 9100,
    kitchenPrinters: [],
    receiptShowLogo: true,
    receiptShowTax: true,
    receiptShowServiceCharge: true,
    receiptShowFooter: true,
    receiptShowOrderNumber: true,
    receiptShowTableName: true,
    kitchenShowOrderType: true,
    kitchenShowTableName: true,
    kitchenShowOrderNumber: true,
    kitchenShowCustomerName: true,
    kitchenShowQtyUnit: true,
    kitchenShowItemPrice: false,
    kitchenShowNotes: true,
    kitchenShowTimestamp: true,
  });

  const load = useCallback(async () => {
    try {
      const data = await settingsAPI.get();
      setForm(prev => ({
        ...prev,
        ...data,
        kitchenPrinters: Array.isArray(data.kitchenPrinters) ? data.kitchenPrinters : [],
      }));
    } catch {
      showToast('err', t('settings.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const set = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(form);
      showToast('ok', t('settings.saved'));
    } catch {
      showToast('err', t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const activeSection = SECTIONS.find(s => s.key === activeKey) || SECTIONS[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('settings.title')}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t(activeSection.labelKey)}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {saving
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('settings.saving')}</>
            : <><Check size={15} />{t('common.saveChanges')}</>
          }
        </button>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${
          toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'ok' ? <Check size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* ── Two-column body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — section nav */}
        <div className="w-60 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="px-4 pt-5 pb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">
              {t('settings.title')}
            </p>
          </div>
          <nav className="px-3 pb-4 flex flex-col gap-0.5">
            {SECTIONS.map(({ key, icon: Icon, labelKey }) => {
              const active = key === activeKey;
              return (
                <button
                  key={key}
                  onClick={() => setActiveKey(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={17} className={`flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="flex-1 truncate">{t(labelKey)}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* RIGHT — content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl px-8 py-7">

            <activeSection.Panel form={form} set={set} t={t} />

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('settings.saving')}</>
                  : <><Check size={15} />{t('common.saveChanges')}</>
                }
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
