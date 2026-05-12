import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PickupStatus } from '@/types';
import { Colors } from '@/constants/colors';

interface Step {
  key: PickupStatus;
  label: string;
}

const STEPS: Step[] = [
  { key: 'parent_arrived', label: 'Arrived' },
  { key: 'released', label: 'Released' },
  { key: 'picked_up', label: 'Confirmed' },
];

const STATUS_ORDER: Record<PickupStatus, number> = {
  in_school: 0,
  parent_arrived: 1,
  released: 2,
  picked_up: 3,
};

interface StatusTrackerProps {
  status: PickupStatus;
}

export function StatusTracker({ status }: StatusTrackerProps) {
  const currentOrder = STATUS_ORDER[status];

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const stepOrder = index + 1;
        const isDone = currentOrder >= stepOrder;
        const isActive = currentOrder === stepOrder;
        const isLast = index === STEPS.length - 1;

        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepContainer}>
              <View
                style={[
                  styles.circle,
                  isDone && styles.circleDone,
                  isActive && !isDone && styles.circleActive,
                  !isDone && !isActive && styles.circlePending,
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Text style={[styles.stepNum, !isActive && styles.stepNumPending]}>
                    {stepOrder}
                  </Text>
                )}
              </View>
              <Text style={[styles.label, isDone && styles.labelDone, isActive && styles.labelActive]}>
                {step.label}
              </Text>
            </View>

            {!isLast && (
              <View
                style={[
                  styles.line,
                  currentOrder > stepOrder ? styles.lineDone : styles.linePending,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  stepContainer: {
    alignItems: 'center',
    width: 80,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  circleDone: {
    backgroundColor: Colors.success,
  },
  circleActive: {
    backgroundColor: Colors.primary,
  },
  circlePending: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stepNum: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  stepNumPending: {
    color: Colors.text.light,
  },
  label: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  labelDone: {
    color: Colors.success,
    fontWeight: '600',
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  line: {
    flex: 1,
    height: 2,
    marginTop: 18,
    marginHorizontal: 2,
  },
  lineDone: {
    backgroundColor: Colors.success,
  },
  linePending: {
    backgroundColor: Colors.border,
  },
});
