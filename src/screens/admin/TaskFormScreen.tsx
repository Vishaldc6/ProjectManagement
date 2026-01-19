import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import { getDocs, query, where } from '@react-native-firebase/firestore';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { RichEditor } from 'react-native-pell-rich-editor';

import {
  BaseButton,
  BaseDropDown,
  BaseIcon,
  BaseInput,
  BaseLoader,
  BaseRichTextInput,
} from '../../components';
import {
  CommentType,
  MemberType,
  ProjectType,
  TaskStatusEnum,
  TaskType,
  UserType,
} from '../../types/appTypes';
import { userRef } from '../../firebase/userCollection';
import { addComment, addTask } from '../../firebase/taskCollection';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { useAppRoutes } from '../../hooks/useAppRoute';
import appColors from '../../styles/appColors';
import appFonts from '../../styles/appFonts';
import { fetchSingleProject } from '../../firebase/projectCollection';
import { TASK_STATUS_LIST } from '../../constants';
import { sendNotification, toCapitalize } from '../../utils/helperFunctions';
import { useAppSelector } from '../../hooks/reduxHooks';
import { UploadFileType } from '../../components/BaseRichTextInput';
import { uploadFilesToSupabase } from '../../supabase';

const TaskFormScreen = () => {
  const { user } = useAppSelector(state => state.AuthReducer);
  const { params } = useAppRoutes<'TaskForm'>();
  const navigation = useAppNavigation('TaskForm');

  const isUpdateMode = !!params?.task;
  const IS_ADMIN = user?.role == 'Admin';

  const [currentStatus, setCurrentStatus] = useState<TaskStatusEnum>(
    TaskStatusEnum.TO_DO,
  );
  const [memberList, setMemberList] = useState<MemberType[]>([]);
  const [project, setProject] = useState<Partial<ProjectType>>();
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<UploadFileType[]>([]);
  const richTextRef = useRef<RichEditor>(null);

  const taskValidationSchema = yup.object({
    projectName: yup.string().trim().required('please enter project name'),
    taskTitle: yup
      .string()
      .trim()
      .required('please enter task title')
      .min(2, 'task title at least have 2 characters'),
    description: yup
      .string()
      .trim()
      .required('please enter description')
      .min(10, 'description at least have 10 characters'),
    assignedMember: yup
      .string()
      .required('please choose member to assign task'),
  });

  type InitialValueType = {
    projectName: string;
    taskTitle: string;
    description: string;
    assignedMember: string;
    assignedMemberName: string;
    comment?: string;
  };

  const {
    values,
    errors,
    touched,
    handleSubmit,
    handleBlur,
    handleChange,
    setFieldValue,
    setValues,
    setFieldTouched,
  } = useFormik<InitialValueType>({
    initialValues: {
      projectName: '',
      taskTitle: '',
      description: '',
      assignedMember: '',
      assignedMemberName: '',
      comment: '',
    },
    validationSchema: taskValidationSchema,
    onSubmit: () => {
      handleSaveTask();
    },
  });

  useEffect(() => {
    if (IS_ADMIN && params?.projectId) {
      setIsLoading(true);
      fetchSingleProject(params?.projectId ?? '').then(proj =>
        setProject(proj),
      );
    }

    if (params.task) {
      setCurrentStatus(params.task.task_status);
      setValues({
        taskTitle: params.task.title,
        projectName: params.task.project_title,
        description: params.task.description,
        assignedMember: params.task.assigned_to,
        assignedMemberName: params.task.assigned_member,
      });
    }
  }, []);

  useEffect(() => {
    if (project && IS_ADMIN) {
      setFieldValue('projectName', project?.title);

      const q = query(
        userRef,
        where('role', '!=', 'Admin'),
        where('id', 'in', project?.member_list),
      );

      getDocs(q).then(querySnapshot => {
        const _memberList: MemberType[] = [];
        querySnapshot.forEach((doc: any) => {
          _memberList.push(doc.data());
        });
        setMemberList(_memberList);
        setIsLoading(false);
      });
    }
  }, [project]);

  const shouldUpdate = () => {
    if (
      params.task &&
      params.task.assigned_to === values.assignedMember &&
      params.task.assigned_member === values.assignedMemberName &&
      params.task.description === values.description &&
      params.task.title === values.taskTitle &&
      params.task.project_title === values.projectName &&
      params.task.task_status === currentStatus
    ) {
      console.log(' not changes  ---');
      return false;
    }

    return true;
  };

  const handleSaveTask = async () => {
    const taskData: Partial<TaskType> = {
      ...params.task,
      assigned_to: values.assignedMember,
      assigned_member: values.assignedMemberName,
      description: values.description,
      project_id: params?.projectId,
      project_title: values.projectName,
      task_status: currentStatus,
      title: values.taskTitle,
      created_by: user?.id,
    };
    if (shouldUpdate()) {
      setIsLoading(true);
      if (files.length) {
        const urlList = await uploadFilesToSupabase(files);
        taskData.file_url = [...(taskData.file_url ?? []), ...urlList];
      }
      addTask(taskData)
        .then(res => {
          setIsLoading(false);
          navigation.goBack();
        })
        .catch(er => {
          console.log({ er });
          setIsLoading(false);
          Alert.alert(
            isUpdateMode ? 'Update Task' : 'Add Task',
            'Something went wrong!',
          );
        });
    }
    console.log(' cmt check');
    if (isUpdateMode && !IS_ADMIN && values.comment?.trim().length) {
      setIsLoading(true);
      const commentData: Partial<CommentType> = {
        task_id: taskData.id,
        author: user?.name,
        author_id: user?.id,
        message: values.comment,
      };
      if (files.length) {
        const urlList = await uploadFilesToSupabase(files);
        commentData.file_url = urlList;
      }
      
      await addComment(commentData)
        .then(() => {
          sendNotification({
            body: `Comment for Task: ${taskData?.title}`,
            data: {
              task_id: taskData?.id,
            },
            title: 'New Comment',
            user_id: IS_ADMIN
              ? taskData?.assigned_to ?? ''
              : taskData?.created_by ?? '',
          });
          setIsLoading(false);
          navigation.goBack();
        })
        .catch(() => {
          setIsLoading(false);
          Alert.alert('Update Task', 'Something went wrong!');
        });
    }
  };

  const renderItem = (item: UserType) => {
    return (
      <View style={styles.dropdownItem}>
        <Text>{item.name}</Text>
        <Text style={styles.dropdownItemSubText}>{item.role}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading && <BaseLoader />}
      {isUpdateMode && !IS_ADMIN ? (
        <>
          <BaseRichTextInput
            ref={richTextRef}
            initialContentHTML={values.comment}
            title="Comment"
            onChange={text => {
              handleChange('comment')(text);
            }}
            placeholder="Enter Task Comment"
            shouldAddFile
            onFileSelect={res => {
              res && setFiles([res]);
            }}
          />
        </>
      ) : (
        <>
          <BaseInput
            title="Project"
            readOnly
            value={values.projectName}
            errorMessage={
              touched.projectName && errors.projectName
                ? errors.projectName
                : ''
            }
          />
          <BaseInput
            title="Task Title"
            placeholder="Enter Task title"
            required
            value={values.taskTitle}
            onChangeText={handleChange('taskTitle')}
            onBlur={handleBlur('taskTitle')}
            errorMessage={
              touched.taskTitle && errors.taskTitle ? errors.taskTitle : ''
            }
          />

          <BaseRichTextInput
            ref={richTextRef}
            required
            initialContentHTML={values.description}
            title="Task Description"
            onChange={text => {
              handleChange('description')(text);
            }}
            onBlur={() => {
              setFieldTouched('description', true);
              handleBlur('description');
            }}
            placeholder="Enter Task Description"
            errorMessage={
              touched.description && errors.description
                ? errors.description
                : ''
            }
            shouldAddFile
            onFileSelect={res => {
              res && setFiles([res]);
            }}
          />

          <BaseDropDown
            title={'Assign Member'}
            required
            data={memberList}
            labelField="name"
            valueField="id"
            placeholder="Select member"
            renderItem={renderItem}
            value={values.assignedMember}
            onChange={val => {
              handleChange('assignedMember')(val.id);
              handleChange('assignedMemberName')(val.name);
            }}
            onBlur={() => handleBlur('assignedMember')}
            errorMessage={
              touched.assignedMember && errors.assignedMember
                ? errors.assignedMember
                : ''
            }
          />
        </>
      )}

      {isUpdateMode && (
        <>
          <Text style={styles.inputHeader}>{'Status'}</Text>
          <View style={styles.statusBtnContainer}>
            {TASK_STATUS_LIST.map(status => {
              const isSelected = status === currentStatus;
              const iconColor =
                status === TaskStatusEnum.DONE
                  ? appColors.TASK_DONE
                  : status === TaskStatusEnum.TO_DO
                  ? appColors.TASK_TODO
                  : appColors.TASK_IN_PROGRESS;
              return (
                <TouchableOpacity
                  style={[
                    styles.statusBtn,
                    isSelected && {
                      borderColor: appColors.PRIMARY,
                      backgroundColor: appColors.PRIMARY_LIGHT_BACKGROUND,
                    },
                  ]}
                  onPress={() => setCurrentStatus(status)}
                >
                  <BaseIcon
                    name="CircleDot"
                    color={iconColor}
                    size={appFonts.FONT_14}
                  />
                  <Text style={styles.statusBtnText}>
                    {toCapitalize(status)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
      <BaseButton
        title={isUpdateMode ? 'Update Task' : 'Add Task'}
        onPress={handleSubmit}
      />
    </View>
  );
};

export default TaskFormScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: widthPercentageToDP(3),
    gap: heightPercentageToDP(1.5),
  },
  textArea: {
    height: heightPercentageToDP(15),
    textAlignVertical: 'top',
  },
  dropdownItem: {
    padding: widthPercentageToDP(2),
  },
  dropdownItemSubText: {
    color: appColors.SECONDARY_TEXT,
    fontSize: appFonts.FONT_10,
  },
  statusBtnContainer: {
    flexDirection: 'row',
    gap: widthPercentageToDP(3),
  },
  statusBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    padding: widthPercentageToDP(1),
    paddingHorizontal: widthPercentageToDP(2),
    gap: widthPercentageToDP(1),
    borderRadius: widthPercentageToDP(5),
  },
  statusBtnText: {},
  inputHeader: {
    fontWeight: '500',
  },
});
