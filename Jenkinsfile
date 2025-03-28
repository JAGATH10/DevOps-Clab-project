pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'clab-task-app'
        DOCKER_HUB_USER = 'jagath10'
        AWS_REGION = 'us-east-1'
        SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:908027374186:created_success'
        EC2_INSTANCE = '54.234.43.52'
    }

    stages {
        stage('Initialize Variables') {
            steps {
                script {
                    env.DOCKER_TAG = "latest-${System.currentTimeMillis()}"
                    env.CONTAINER_NAME = "clab-container-${System.currentTimeMillis()}"
                }
            }
        }

        stage('Checkout Code') {
            steps {
                script {
                    git branch: 'main', url: 'https://github.com/JAGATH10/DevOps-Clab-project.git'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                }
            }
        }

        stage('Tag & Push Docker Image to Docker Hub') {
            steps {
                script {
                    sh """
                        docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG}
                        docker login -u ${DOCKER_HUB_USER} -p ${env.DOCKER_PASSWORD}
                        docker push ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG}
                    """
                }
            }
        }

        stage('Deploy on EC2') {
            steps {
                script {
                    sh """
                        ssh -o StrictHostKeyChecking=no ec2-user@${EC2_INSTANCE} '
                        docker pull ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG} &&
                        docker stop \$(docker ps -q --filter ancestor=${DOCKER_HUB_USER}/${DOCKER_IMAGE}) || true &&
                        docker run -d --name ${CONTAINER_NAME} -p 3000:3000 ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG}'
                    """
                }
            }
        }

        stage('Notify Success via AWS SNS') {
            steps {
                withCredentials([
                    string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    script {
                        sh """
                            export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                            export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                            aws sns publish --region ${AWS_REGION} --topic-arn ${SNS_TOPIC_ARN} --message 'Build & Deployment successful!'
                        """
                    }
                }
            }
        }
    }

    post {
        failure {
            withCredentials([
                string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
                string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
            ]) {
                script {
                    sh """
                        export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                        export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                        aws sns publish --region ${AWS_REGION} --topic-arn ${SNS_TOPIC_ARN} --message 'Build & Deployment failed!'
                    """
                }
            }
        }
    }
}
