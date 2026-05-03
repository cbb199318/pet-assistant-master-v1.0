import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type DatePickerFieldProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
  allowClear?: boolean;
};

const MIN_YEAR = 2000;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseDate(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [yearText, monthText, dayText] = value.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);

    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day) &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return { year, month, day };
    }
  }

  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function DatePickerField({
  value,
  onChange,
  placeholder = '请选择日期',
  title = '选择日期',
  allowClear = false,
}: DatePickerFieldProps) {
  const [visible, setVisible] = useState(false);
  const [draftDate, setDraftDate] = useState(() => parseDate(value));

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 10;
    return Array.from({ length: maxYear - MIN_YEAR + 1 }, (_, index) => MIN_YEAR + index);
  }, []);

  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);

  const days = useMemo(
    () =>
      Array.from(
        { length: getDaysInMonth(draftDate.year, draftDate.month) },
        (_, index) => index + 1,
      ),
    [draftDate.month, draftDate.year],
  );

  const openPicker = () => {
    setDraftDate(parseDate(value));
    setVisible(true);
  };

  const closePicker = () => {
    setVisible(false);
  };

  const handleConfirm = () => {
    onChange(formatDate(draftDate.year, draftDate.month, draftDate.day));
    closePicker();
  };

  const handleClear = () => {
    onChange('');
    closePicker();
  };

  const updateDraftDate = (nextDate: Partial<typeof draftDate>) => {
    setDraftDate((currentDate) => {
      const mergedDate = { ...currentDate, ...nextDate };
      const maxDay = getDaysInMonth(mergedDate.year, mergedDate.month);
      return {
        ...mergedDate,
        day: Math.min(mergedDate.day, maxDay),
      };
    });
  };

  return (
    <>
      <TouchableOpacity style={styles.fieldButton} activeOpacity={0.85} onPress={openPicker}>
        <Text style={value ? styles.fieldValue : styles.fieldPlaceholder}>
          {value || placeholder}
        </Text>
        <Text style={styles.fieldSuffix}>选择</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={closePicker}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closePicker}>
          <TouchableOpacity activeOpacity={1} style={styles.panel} onPress={() => {}}>
            <View style={styles.header}>
              <TouchableOpacity onPress={closePicker}>
                <Text style={styles.headerSecondaryText}>取消</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{title}</Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.headerPrimaryText}>确定</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.previewText}>
              {formatDate(draftDate.year, draftDate.month, draftDate.day)}
            </Text>

            <Text style={styles.sectionTitle}>年份</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.chip,
                    draftDate.year === year && styles.chipActive,
                  ]}
                  onPress={() => updateDraftDate({ year })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      draftDate.year === year && styles.chipTextActive,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>月份</Text>
            <View style={styles.grid}>
              {months.map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.gridButton,
                    draftDate.month === month && styles.gridButtonActive,
                  ]}
                  onPress={() => updateDraftDate({ month })}
                >
                  <Text
                    style={[
                      styles.gridButtonText,
                      draftDate.month === month && styles.gridButtonTextActive,
                    ]}
                  >
                    {month}月
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>日期</Text>
            <ScrollView
              style={styles.dayList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.grid}
            >
              {days.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.gridButton,
                    draftDate.day === day && styles.gridButtonActive,
                  ]}
                  onPress={() => updateDraftDate({ day })}
                >
                  <Text
                    style={[
                      styles.gridButtonText,
                      draftDate.day === day && styles.gridButtonTextActive,
                    ]}
                  >
                    {day}日
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {allowClear && value ? (
              <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                <Text style={styles.clearButtonText}>清空日期</Text>
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fieldButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
  },
  fieldPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  fieldSuffix: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 22, 16, 0.36)',
    justifyContent: 'flex-end',
  },
  panel: {
    maxHeight: '78%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243029',
  },
  headerSecondaryText: {
    fontSize: 15,
    color: '#6f7c73',
  },
  headerPrimaryText: {
    fontSize: 15,
    color: '#2f6e43',
    fontWeight: '700',
  },
  previewText: {
    marginTop: 14,
    marginBottom: 18,
    fontSize: 24,
    fontWeight: '800',
    color: '#223026',
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 14,
    color: '#5b6d61',
    fontWeight: '700',
  },
  horizontalList: {
    paddingBottom: 14,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#f2f6f3',
  },
  chipActive: {
    backgroundColor: '#dcefe1',
  },
  chipText: {
    color: '#5f7066',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#1f6f45',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridButton: {
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#f2f6f3',
    alignItems: 'center',
  },
  gridButtonActive: {
    backgroundColor: '#dcefe1',
  },
  gridButtonText: {
    color: '#5f7066',
    fontWeight: '600',
  },
  gridButtonTextActive: {
    color: '#1f6f45',
  },
  dayList: {
    maxHeight: 220,
    marginBottom: 16,
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#fff3f3',
  },
  clearButtonText: {
    color: '#b54848',
    fontWeight: '700',
  },
});
